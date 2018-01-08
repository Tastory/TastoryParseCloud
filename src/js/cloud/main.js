"use strict";
//
//  main.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
console.log("Tastory Parse Cloud Code main.js Running");
//
//  global.js
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-05
//  Copyright © 2018 Tastry. All rights reserved.
//
//
//  claimOnStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
Parse.Cloud.define("storyClaim", function (req, res) {
    debugConsole.log(SeverityEnum.Debug, "claimOnStory.ts ParseCloudFunction 'storyClaim' triggered");
    // Then we gotta establish who the reporter is first
    let user = undefined;
    if (req.user != undefined) {
        user = req.user;
    }
    else if (req.master === true) {
        user = null;
        debugConsole.log(SeverityEnum.Warning, "'storyClaim' called with master not yet supported!!");
        res.error("User-less Claim via Master Key not yet supported");
        return;
    }
    else {
        debugConsole.log(SeverityEnum.Warning, "'storyClaim' called with no source reporter!!");
        res.error("A source reporter is required to make a Reputation Claim against a Story");
        return;
    }
    // Extract storyId and claim type
    let storyId = req.params.storyId;
    let reporterId = user.id;
    // Process the claim input
    claimInputForStory(reporterId, storyId, req.params, function (anyArg, errorMsg) {
        if (!errorMsg) {
            debugConsole.log(SeverityEnum.Warning, "errorMsg");
            res.error(errorMsg);
        }
        else {
            debugConsole.log(SeverityEnum.Debug, "ParseCloudFunction 'storyClaim' success response");
            res.success(anyArg);
        }
    });
});
function claimInputForStory(reporterId, storyId, claimParameters, callback) {
    debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts " + claimInputForStory.name + "() executed");
    // To understand what action needs to be taken for the new claim inputClaimOnStory
    // We have to first query the ReputableClaim database
    // let ReputableClaim = Parse.Object.extend("ReputableClaim");
    let query = new Parse.Query(ReputableClaim);
    query.equalTo("sourceId", reporterId);
    query.equalTo("targetId", storyId);
    query.find().then(function (results) {
        debugConsole.log(SeverityEnum.Debug, "ReputableClaim query resulted in " + results.length + " matches");
        // Determine the exact claim scenario, then extract the relevant
        // parameters and supply it into the next claim processing function
        debugConsole.log(SeverityEnum.Debug, "Story Reputation Claim Input" +
            "\nSource ID: " + reporterId +
            "\nTarget ID: " + storyId +
            "\nStory Claim Type: " + claimParameters.storyClaimType +
            "\nSet or Clear: " + claimParameters.setNotClear +
            "\nReaction Type: " + claimParameters.reactionType +
            "\nAction Type: " + claimParameters.actionType +
            "\nMoment Number: " + claimParameters.momentNumber);
        switch (claimParameters.storyClaimType) {
            case StoryClaimTypeEnum.Reaction:
                if (claimParameters.setNotClear) {
                    storySetReactionClaim(reporterId, storyId, claimParameters.reactionType, results, callback);
                }
                else {
                    storyClearReactionClaim(reporterId, storyId, claimParameters.reactionType, results, callback);
                }
                break;
            case StoryClaimTypeEnum.StoryAction:
                storyActionClaim(reporterId, storyId, claimParameters.actionType, results, callback);
                break;
            case StoryClaimTypeEnum.StoryViewed:
                storyViewedClaim(reporterId, storyId, claimParameters.momentNumber, results, callback);
                break;
        }
    }, function (error) {
        debugConsole.log(SeverityEnum.Warning, "Parse query failed at " + claimInputForStory.name + "(): " + error.code + " " + error.message);
        callback(null, "Parse Query failed at claimInputForStory(): " + error.code + " " + error.message);
    });
}
function storySetReactionClaim(reporterId, storyId, reactionType, claimsHistory, callback) {
    debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts - storySetReactionClaim() executed");
    for (let claim of claimsHistory) {
        debugConsole.log(SeverityEnum.Verbose, "Claim Type: " + claim.get("claimType") + " StoryClaimType: " + claim.get("storyClaimType"));
    }
    // Look at the claims history for already set reactions
    let existingReactions = claimsHistory.filter(claim => (claim.get("claimType") === ReputationClaimTypeEnum.StoryClaim &&
        claim.get("storyClaimType") === StoryClaimTypeEnum.Reaction));
    debugConsole.log(SeverityEnum.Debug, "StoyReaction filter resulted in " + existingReactions.length + " matches");
    // Do all operations against Parse via Master key. As the ReputableClaim class is restricted
    let masterKeyOption = { useMasterKey: true };
    // No previous Reactions found, just set and save a new Reaction
    if (existingReactions.length === 0) {
        let storyReactionClaim = new ReputableClaim();
        storyReactionClaim.setAsStoryReaction(reporterId, storyId, reactionType);
        debugConsole.log(SeverityEnum.Verbose, "No previous Reactions found by " + reporterId + " against " + storyId + "saving a new Story Reaction Claim");
        storyReactionClaim.save(null, masterKeyOption).then(function (object) {
            // TODO: - Do Roll-up Here, or do it as a then case
            // For now, just log and returned. Also note returned object isn't even correct
            debugConsole.log(SeverityEnum.Verbose, "Parse save new Story Reaction success. Calling back for now");
            callback(object, "Parse save new Story Reaction Success");
        }, function (error) {
            debugConsole.log(SeverityEnum.Warning, "Parse save new Story Reaction failed at storySetReactionClaim(): " + error.code + " " + error.message);
            callback(null, "Parse save new Story Reaction failed at storySetReactionClaim(): " + error.code + " " + error.message);
        });
    }
    else {
        if (existingReactions.length <= 1) {
            debugConsole.log(SeverityEnum.Verbose, existingReactions.length + " Reactions found by " + reporterId + " to " + storyId);
        }
        else {
            debugConsole.log(SeverityEnum.Warning, "Unexpected to find " + existingReactions.length + " Reactions by " + reporterId + " to " + storyId);
        }
        let sameReaction = existingReactions.filter(reaction => (reaction.get("reactionType") === reactionType));
        // Not the same Reaction, clear, set then save a new Reaction
        if (existingReactions.length != 1 || sameReaction.length != 0) {
            let storyReactionClaim = new ReputableClaim();
            storyReactionClaim.setAsStoryReaction(reporterId, storyId, reactionType);
            debugConsole.log(SeverityEnum.Verbose, "Clear and saving a new Story Reaction Claim");
            Parse.Object.destroyAll(existingReactions, masterKeyOption).then(function () {
                return storyReactionClaim.save(null, masterKeyOption);
            }).then(function (object) {
                // TODO: - Do Roll-up Here, or do it as a then case
                // For now, just log and returned. Also note returned object isn't even correct
                debugConsole.log(SeverityEnum.Verbose, "Parse clear & save new Story Reaction success. Calling back for now");
                callback(object, "Parse clear & save new Story Reaction Success");
            }, function (error) {
                debugConsole.log(SeverityEnum.Warning, "Parse clear & save new Story Reaction failed at storySetReactionClaim(): " + error.code + " " + error.message);
                callback(null, "Parse clear & save new Story Reaction failed at storySetReactionClaim(): " + error.code + " " + error.message);
            });
            // Exiting Reaction matches the Desired Reaction
        }
        else {
            // TODO: For now, just log and returned. Also note returned object isn't even correct
            debugConsole.log(SeverityEnum.Verbose, "Desired Reaction state already exist. Calling back for now");
            callback(null, "Desired Reaction state already exist. Success");
        }
    }
}
function storyClearReactionClaim(reporterId, storyId, reactionType, claimsHistory, callback) {
    debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts " + storyClearReactionClaim.name + "() executed");
}
function storyActionClaim(reporterId, storyId, actionType, claimsHistory, callback) {
    debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts " + storyActionClaim.name + "() executed");
}
function storyViewedClaim(reporterId, storyId, momentNumber, claimsHistory, callback) {
    debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts " + storyViewedClaim.name + "() executed");
}
//
//  reputableClaim.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
var ReputationClaimTypeEnum;
(function (ReputationClaimTypeEnum) {
    ReputationClaimTypeEnum["StoryClaim"] = "storyClaim";
})(ReputationClaimTypeEnum || (ReputationClaimTypeEnum = {}));
var StoryClaimTypeEnum;
(function (StoryClaimTypeEnum) {
    StoryClaimTypeEnum[StoryClaimTypeEnum["Reaction"] = 1] = "Reaction";
    StoryClaimTypeEnum[StoryClaimTypeEnum["StoryAction"] = 2] = "StoryAction";
    StoryClaimTypeEnum[StoryClaimTypeEnum["StoryViewed"] = 3] = "StoryViewed";
})(StoryClaimTypeEnum || (StoryClaimTypeEnum = {}));
var StoryReactionTypeEnum;
(function (StoryReactionTypeEnum) {
    StoryReactionTypeEnum[StoryReactionTypeEnum["Like"] = 1] = "Like";
})(StoryReactionTypeEnum || (StoryReactionTypeEnum = {}));
;
var StoryActionTypeEnum;
(function (StoryActionTypeEnum) {
    StoryActionTypeEnum[StoryActionTypeEnum["Swiped"] = 1] = "Swiped";
    StoryActionTypeEnum[StoryActionTypeEnum["Venue"] = 2] = "Venue";
    StoryActionTypeEnum[StoryActionTypeEnum["Profile"] = 3] = "Profile";
})(StoryActionTypeEnum || (StoryActionTypeEnum = {}));
;
class ReputableClaim extends Parse.Object {
    constructor() {
        super("ReputableClaim");
    }
    setAsStoryReaction(reporterId, storyId, reactionType) {
        this.set("sourceId", reporterId);
        this.set("targetId", storyId);
        this.set("claimType", ReputationClaimTypeEnum.StoryClaim);
        this.set("storyClaimType", StoryClaimTypeEnum.Reaction);
        this.set("storyReactionType", reactionType);
    }
    setAsStoryAction(reporterId, storyId, actionType) {
        this.set("sourceId", reporterId);
        this.set("targetId", storyId);
        this.set("claimType", ReputationClaimTypeEnum.StoryClaim);
        this.set("storyClaimType", StoryClaimTypeEnum.StoryAction);
        this.set("storyActionType", actionType);
    }
    setAsStoryViewed(reporterId, storyId, momentNumber) {
        this.set("sourceId", reporterId);
        this.set("targetId", storyId);
        this.set("claimType", ReputationClaimTypeEnum.StoryClaim);
        this.set("storyClaimType", StoryClaimTypeEnum.StoryViewed);
        this.set("storyMomentNumber", momentNumber);
    }
}
Parse.Object.registerSubclass("ReputableClaim", ReputableClaim);
//
//  reputableStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
class ReputableStory extends Parse.Object {
    constructor() {
        super("ReputableStory");
    }
    initializeRollUp(scoreMetricVer) {
        this.set("scoreMetricVer", scoreMetricVer);
        this.set("usersViewed", 0);
        this.set("usersLiked", 0);
        this.set("usersSwipedUp", 0);
        this.set("usersClickedVenue", 0);
        this.set("usersClickedProfile", 0);
        this.set("avgMomentNumber", 0);
        this.set("totalViews", 0);
    }
    // Explicit Claims
    incUsersLiked() {
        let usersLiked = this.get(ReputableStory.usersLikedKey) + 1;
        this.set(ReputableStory.usersLikedKey, usersLiked);
    }
    decUsersLiked() {
        let usersLiked = this.get(ReputableStory.usersLikedKey) - 1;
        this.set(ReputableStory.usersLikedKey, usersLiked);
    }
    // Implicit Claims
    incUsersSwipedUp() {
        let usersSwipedUp = this.get(ReputableStory.usersSwipedUpKey) + 1;
        this.set(ReputableStory.usersSwipedUpKey, usersSwipedUp);
    }
    incUsersClickedVenue() {
        let usersClickedVenue = this.get(ReputableStory.usersClickedVenueKey) + 1;
        this.set(ReputableStory.usersClickedVenueKey, usersClickedVenue);
    }
    thisUsersClickedProfile() {
        let usersClickedProfile = this.get(ReputableStory.usersClickedProfileKey) + 1;
        this.set(ReputableStory.usersClickedProfileKey, usersClickedProfile);
    }
    // View Counts
    incUsersViewed() {
        let usersViewed = this.get(ReputableStory.usersViewedKey) + 1;
        this.set(ReputableStory.usersViewedKey, usersViewed);
    }
    incTotalViewed() {
        let totalViews = this.get(ReputableStory.totalViewsKey) + 1;
        this.set(ReputableStory.totalViewsKey, totalViews);
    }
    recalAvgMomentNumber(prevMomentNumber, newMomentNumber) {
        let avgMomentNumber = this.get(ReputableStory.avgMomentNumberKey);
        let usersViewed = this.get(ReputableStory.usersViewedKey);
        let totalMomentNumber = avgMomentNumber * usersViewed;
        totalMomentNumber = totalMomentNumber - prevMomentNumber + newMomentNumber;
        avgMomentNumber = totalMomentNumber / usersViewed;
        this.set(ReputableStory.avgMomentNumberKey, avgMomentNumber);
    }
    calculateStoryScore() {
    }
}
ReputableStory.scoreMetricVerKey = "scoreMetricVer";
ReputableStory.usersViewedKey = "usersViewed";
ReputableStory.usersLikedKey = "usersLiked";
ReputableStory.usersSwipedUpKey = "usersSwipedUp";
ReputableStory.usersClickedVenueKey = "usersClickedVenue";
ReputableStory.usersClickedProfileKey = "usersClickedProfile";
ReputableStory.avgMomentNumberKey = "avgMomentNumber";
ReputableStory.totalViewsKey = "totalViews";
Parse.Object.registerSubclass("ReputableStory", ReputableStory);
//
//  reputableUser.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
class ReputableUser extends Parse.Object {
    constructor() {
        super("ReputableUser");
    }
}
Parse.Object.registerSubclass("ReputableUser", ReputableUser);
//
//  scoreStoryMetric.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
class ScoreStoryMetric {
    constructor(baseScore, percentageLikeWeighting, avgMomentWeighting, usersViewedWeighting, percentageSwipedWeighting, percentageProfileClickedWeighting, percetnageVenueClickedWeighting, newnessFactor, newnessHalfLife, decayHalfLife, avgMomentInverseConstant, usersViewedLogConstant) {
        this.baseScore = baseScore;
        this.percentageLikeWeighting = percentageLikeWeighting;
        this.avgMomentWeighting = avgMomentWeighting;
        this.usersViewedWeighting = usersViewedWeighting;
        this.percentageSwipedWeighting = percentageSwipedWeighting;
        this.percentageProfileClickedWeighting = percentageProfileClickedWeighting;
        this.percetnageVenueClickedWeighting = percetnageVenueClickedWeighting;
        this.newnessFactor = newnessFactor;
        this.newnessHalfLife = newnessHalfLife;
        this.decayHalfLife = decayHalfLife;
        this.avgMomentInverseConstant = avgMomentInverseConstant;
        this.usersViewedLogConstant = usersViewedLogConstant;
    }
}
ScoreStoryMetric.scoreMetricVer = [
    // Story Scoring Metric ver. 1
    new ScoreStoryMetric(10, // baseScore: number;
    40, // percentageLikeWeighting: number;
    30, // avgMomentWeighting: number;
    30, // usersViewedWeighting: number;
    20, // percentageSwipedWeighting: number;
    10, // percentageProfileClickedWeighting: number;
    10, // percetnageVenueClickedWeighting: number;
    0.9, // newnessFactor: number;
    1.0, // newnessHalfLife: number; (in days)
    120, // decayHalfLife: number; (in days)
    0.3, // avgMomentInverseConstant: number;
    20) // usersViewedLogConstant: number;
    // More Story Scoring Metrics...
];
//
//  debugConsole.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-05
//  Copyright © 2018 Tastry. All rights reserved.
//
/* !!! Define Severity Enum here !!! */
var SeverityEnum;
(function (SeverityEnum) {
    SeverityEnum[SeverityEnum["Verbose"] = 0] = "Verbose";
    SeverityEnum[SeverityEnum["Debug"] = 1] = "Debug";
    SeverityEnum[SeverityEnum["Info"] = 2] = "Info";
    SeverityEnum[SeverityEnum["Warning"] = 3] = "Warning";
})(SeverityEnum || (SeverityEnum = {}));
/* !!! Configure Global Debug Severity here !!! */
let debugConsoleSeverity = SeverityEnum.Verbose;
class DebugConsole {
    // MARK: - Class Constructor
    constructor(severity) {
        this.loggingSeverity = severity;
    }
    // MARK: - Public Static Functions
    static getSingleton() {
        if (!DebugConsole.singleton) {
            DebugConsole.singleton = new DebugConsole(debugConsoleSeverity);
        }
        return DebugConsole.singleton;
    }
    // MARK: - Private Instance Functions
    severityHeader(severity) {
        switch (severity) {
            case SeverityEnum.Verbose:
                return "VERBOSE: ";
            case SeverityEnum.Debug:
                return "DEBUG:   ";
            case SeverityEnum.Info:
                return "INFO:    ";
            case SeverityEnum.Warning:
                return "WARNING: ";
        }
    }
    // MARK: - Public Instance Functions
    log(severity, message) {
        if (severity >= this.loggingSeverity) {
            console.log(this.severityHeader(severity) + message);
        }
    }
    error(message) {
        console.error("ERROR:   " + message);
    }
}
// MARK: - Global Access to Debug Print Singleton
var debugConsole = DebugConsole.getSingleton();
