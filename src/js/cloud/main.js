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
const masterKeyOption = { useMasterKey: true };
var reputationScoreStoryMetricVer = 1;
//
//  debugConsole.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-05
//  Copyright © 2018 Tastry. All rights reserved.
//
/* !!! Define Severity Enum here !!! */
var SeverityEnum;
//
//  debugConsole.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-05
//  Copyright © 2018 Tastry. All rights reserved.
//
/* !!! Define Severity Enum here !!! */
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
//
//  foodieStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
class FoodieStory extends Parse.Object {
    constructor() {
        super("FoodieStory");
    }
}
FoodieStory.reputationKey = "reputation";
FoodieStory.discoverabilityKey = "discoverability";
Parse.Object.registerSubclass("FoodieStory", FoodieStory);
//
//  reputableStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
class ReputableStory extends Parse.Object {
    // MARK: - Constructor
    constructor() {
        super("ReputableStory");
    }
    // MARK: - Public Instance Functions
    initializeReputation(story, scoreMetricVer) {
        debugConsole.log(SeverityEnum.Verbose, "reputableStory.ts initializeReputation() for Story ID: " + story.id + " executed");
        this.set(ReputableStory.storyIdKey, story.id);
        this.set(ReputableStory.scoreMetricVerKey, scoreMetricVer);
        this.set(ReputableStory.usersViewedKey, 0);
        this.set(ReputableStory.usersLikedKey, 0);
        this.set(ReputableStory.usersSwipedUpKey, 0);
        this.set(ReputableStory.usersClickedVenueKey, 0);
        this.set(ReputableStory.usersClickedProfileKey, 0);
        this.set(ReputableStory.totalMomentNumberKey, 0);
        this.set(ReputableStory.totalViewsKey, 0);
    }
    // Property Accessors
    getStoryId() {
        let getValue = this.get(ReputableStory.storyIdKey);
        if (getValue) {
            return getValue;
        }
        else {
            return "";
        }
    }
    getScoreMetricVer() {
        let getValue = this.get(ReputableStory.scoreMetricVerKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getUsersViewed() {
        let getValue = this.get(ReputableStory.usersViewedKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getUsersLiked() {
        let getValue = this.get(ReputableStory.usersLikedKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getUsersSwipedUp() {
        let getValue = this.get(ReputableStory.usersSwipedUpKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getUsersClickedVenue() {
        let getValue = this.get(ReputableStory.usersClickedVenueKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getUsersClickedProfile() {
        let getValue = this.get(ReputableStory.usersClickedProfileKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getTotalMomentNumber() {
        let getValue = this.get(ReputableStory.totalMomentNumberKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    getTotalViews() {
        let getValue = this.get(ReputableStory.totalViewsKey);
        if (getValue) {
            return getValue;
        }
        else {
            return 0;
        }
    }
    // Explicit Claims
    incReactions(type) {
        switch (type) {
            case StoryReactionTypeEnum.Like:
                this.incUsersLiked();
                break;
        }
    }
    decReactions(type) {
        switch (type) {
            case StoryReactionTypeEnum.Like:
                this.decUsersLiked();
                break;
        }
    }
    incUsersLiked() {
        this.increment(ReputableStory.usersLikedKey);
    }
    decUsersLiked() {
        this.increment(ReputableStory.usersLikedKey, -1);
    }
    // Implicit Claims
    incActions(type) {
        switch (type) {
            case StoryActionTypeEnum.Swiped:
                this.incUsersSwipedUp();
                break;
            case StoryActionTypeEnum.Venue:
                this.incUsersClickedVenue();
                break;
            case StoryActionTypeEnum.Profile:
                this.incUsersClickedProfile();
                break;
        }
    }
    incUsersSwipedUp() {
        this.increment(ReputableStory.usersSwipedUpKey);
    }
    incUsersClickedVenue() {
        this.increment(ReputableStory.usersClickedVenueKey);
    }
    incUsersClickedProfile() {
        this.increment(ReputableStory.usersClickedProfileKey);
    }
    // View Counts
    incUsersViewed() {
        this.increment(ReputableStory.usersViewedKey);
    }
    incTotalViewed() {
        this.increment(ReputableStory.totalViewsKey);
    }
    addNewView(momentNumber) {
        this.increment(ReputableStory.usersViewedKey);
        this.increment(ReputableStory.totalMomentNumberKey, momentNumber);
    }
    recalMaxMomentNumber(prevMomentNumber, newMomentNumber) {
        let momentOffset = newMomentNumber - prevMomentNumber;
        this.increment(ReputableStory.totalMomentNumberKey, momentOffset);
    }
    // Score Calculation
    calculateStoryScore() {
        let scoringEngine = ScoreStoryMetric.scoreMetricVer[this.getScoreMetricVer()];
        debugConsole.log(SeverityEnum.Verbose, "calculating Story Score");
        if (scoringEngine) {
            return scoringEngine.calculate(this.story, this);
        }
        else {
            debugConsole.log(SeverityEnum.Warning, "Unable to get Scoring Metric Ver: " + this.getScoreMetricVer());
            return ScoreStoryMetric.defaultScore;
        }
    }
    // Logging
    debugConsoleLog(severity) {
        debugConsole.log(severity, "ReputableStory ID: " + this.id +
            "\n" + ReputableStory.scoreMetricVerKey + ": " + this.getScoreMetricVer() +
            "\n" + ReputableStory.usersViewedKey + ": " + this.getUsersViewed() +
            "\n" + ReputableStory.usersLikedKey + ": " + this.getUsersLiked() +
            "\n" + ReputableStory.usersSwipedUpKey + ": " + this.getUsersSwipedUp() +
            "\n" + ReputableStory.usersClickedVenueKey + ": " + this.getUsersClickedVenue() +
            "\n" + ReputableStory.usersClickedProfileKey + ": " + this.getUsersClickedProfile() +
            "\n" + ReputableStory.totalMomentNumberKey + ": " + this.getTotalMomentNumber() +
            "\n" + ReputableStory.totalViewsKey + ": " + this.getTotalViews());
    }
}
// MARK: - Public Static Properties
ReputableStory.storyIdKey = "storyId";
ReputableStory.scoreMetricVerKey = "scoreMetricVer";
ReputableStory.usersViewedKey = "usersViewed";
ReputableStory.usersLikedKey = "usersLiked";
ReputableStory.usersSwipedUpKey = "usersSwipedUp";
ReputableStory.usersClickedVenueKey = "usersClickedVenue";
ReputableStory.usersClickedProfileKey = "usersClickedProfile";
ReputableStory.totalMomentNumberKey = "totalMomentNumber";
ReputableStory.totalViewsKey = "totalViews";
Parse.Object.registerSubclass("ReputableStory", ReputableStory);
//
//  afterSaveFoodieStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
//
// MARK: - TypeScript Dependecies
/// <reference path="../common/global.ts" />
/// <reference path="../utilities/debugConsole.ts" />
/// <reference path="../model/foodie/foodieStory.ts" />
/// <reference path="../model/reputation/reputableStory.ts" />
Parse.Cloud.afterSave("FoodieStory", function (request) {
    let reputableStory;
    let story = request.object;
    debugConsole.log(SeverityEnum.Verbose, "afterSave for storyID " + story.id);
    // We'll just check the existance of a reputableStory object. But dont't access it! It's not yet fetched!
    if (!story.get(FoodieStory.reputationKey)) {
        reputableStory = new ReputableStory();
        reputableStory.initializeReputation(story, reputationScoreStoryMetricVer);
        reputableStory.save(null, masterKeyOption).then(function (reputation) {
            story.set(FoodieStory.reputationKey, reputation);
            return story.save(null, masterKeyOption);
        }).then(function (story) {
            debugConsole.log(SeverityEnum.Debug, "New Reputation ID: " + reputableStory.id + " created for Story ID: " + story.id);
        }, function (error) {
            debugConsole.log(SeverityEnum.Warning, "Failed to create Reputation for Story ID: " + story.id);
        });
    }
});
//
//  beforeSaveFoodieStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
Parse.Cloud.beforeSave("FoodieStory", function (request, response) {
    let story = request.object;
    let reputation = story.get(FoodieStory.reputationKey);
    if (reputation) {
        debugConsole.log(SeverityEnum.Verbose, "beforeSave for storyID " + story.id + " with Reputation");
        reputation.fetch().then(function (reputableStory) {
            debugConsole.log(SeverityEnum.Verbose, "beforeSave reputation fetched for storyID " + story.id);
            reputableStory.story = story;
            story.set(FoodieStory.discoverabilityKey, reputation.calculateStoryScore());
            response.success();
        }, function (error) {
            debugConsole.log(SeverityEnum.Warning, "Unable to fetch ReputableStory for Story ID: " + story.id);
            story.set(FoodieStory.discoverabilityKey, ScoreStoryMetric.defaultScore); // TODO: Initialize or Update Discoverability Score
            response.success();
        });
    }
    else {
        debugConsole.log(SeverityEnum.Verbose, "beforeSave for storyID " + story.id + " without Reputation");
        story.set(FoodieStory.discoverabilityKey, ScoreStoryMetric.initialScore); // TODO: Initialize or Update Discoverability Score
        response.success();
    }
});
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
    let storyId = req.params.targetId;
    let reporterId = user.id;
    // Process the claim input
    claimInputForStory(reporterId, storyId, req.params, function (anyArg, errorMsg) {
        if (!anyArg) {
            debugConsole.log(SeverityEnum.Warning, errorMsg);
            res.error(errorMsg);
        }
        else {
            debugConsole.log(SeverityEnum.Debug, "ParseCloudFunction 'storyClaim' from: " + reporterId + " to: " + storyId + " success response");
            res.success(anyArg);
        }
    });
});
function claimInputForStory(reporterId, storyId, claimParameters, callback) {
    debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts " + claimInputForStory.name + "() executed");
    debugConsole.log(SeverityEnum.Debug, "Story Reputation Claim Input" +
        "\nSource ID: " + reporterId +
        "\nTarget ID: " + storyId +
        "\nStory Claim Type: " + claimParameters.storyClaimType +
        "\nSet or Clear: " + claimParameters.setNotClear +
        "\nReaction Type: " + claimParameters.storyReactionType +
        "\nAction Type: " + claimParameters.storyActionType +
        "\nMoment Number: " + claimParameters.storyMomentNumber);
    // To understand what action needs to be taken for the new claim inputClaimOnStory
    // We have to first query the ReputableClaim database
    let storyClaims;
    let query = new Parse.Query(ReputableClaim);
    query.equalTo(ReputableClaim.sourceIdKey, reporterId);
    query.equalTo(ReputableClaim.targetIdKey, storyId);
    query.equalTo(ReputableClaim.claimTypeKey, ReputationClaimTypeEnum.StoryClaim); // We are only dealing with Story Claims in this function
    query.find().then(function (claims) {
        debugConsole.log(SeverityEnum.Debug, "claimOnStory.ts found " + claims.length + " relevant ReputableClaims");
        storyClaims = claims;
        // Get the Story & associated Reputation here
        // Might want to refactor out if there are other claim types to support
        let query = new Parse.Query(FoodieStory);
        query.include(FoodieStory.reputationKey);
        return query.get(storyId);
    }).then(function (story) {
        let reputableStory;
        // Extract the Reputation from the Story. Otherwise create a new ReputableStory object
        if (!story.get(FoodieStory.reputationKey)) {
            reputableStory = new ReputableStory();
            reputableStory.initializeReputation(story, reputationScoreStoryMetricVer);
        }
        else {
            reputableStory = story.get(FoodieStory.reputationKey);
            reputableStory.debugConsoleLog(SeverityEnum.Verbose);
        }
        reputableStory.story = story;
        // Determine the claim scenario and action applicability
        // Find the immediate response cases before going into the next Promise chain
        let claimToSave = null;
        let claimsToDelete = [];
        switch (claimParameters.storyClaimType) {
            case StoryClaimTypeEnum.Reaction:
                if (claimParameters.setNotClear) {
                    let reactionType = claimParameters.storyReactionType;
                    claimToSave = ReputableClaim.createStoryReactionIfNotFound(reporterId, storyId, reactionType, storyClaims); // Returns claim if created. Null if found
                    if (claimToSave) {
                        reputableStory.incReactions(reactionType);
                    }
                }
                else {
                    let reactionType = claimParameters.storyReactionType;
                    claimsToDelete = ReputableClaim.deleteStoryReactionIfFound(reporterId, storyId, reactionType, storyClaims); // Returns true if cleam deleted
                    // No matter how many claims, just decrement only by 1 for now
                    if (claimsToDelete.length >= 1) {
                        reputableStory.decReactions(reactionType);
                    }
                }
                break;
            case StoryClaimTypeEnum.StoryAction:
                let actionType = claimParameters.storyActionType;
                claimToSave = ReputableClaim.createStoryActionIfNotFound(reporterId, storyId, actionType, storyClaims); // Returns claim if created. Null if found
                if (claimToSave) {
                    reputableStory.incActions(actionType);
                }
                break;
            case StoryClaimTypeEnum.StoryViewed:
                let storyViewReturn = ReputableClaim.updateStoryViewClaim(reporterId, storyId, claimParameters.storyMomentNumber, storyClaims); // Returns claim if created. Null if update not needed
                claimToSave = storyViewReturn.claim;
                if (claimToSave) {
                    if (storyViewReturn.prevMomentNumber) {
                        reputableStory.recalMaxMomentNumber(storyViewReturn.prevMomentNumber, storyViewReturn.newMomentNumber);
                    }
                    else {
                        reputableStory.addNewView(storyViewReturn.newMomentNumber);
                    }
                }
                break;
        }
        if (claimToSave) {
            // Save Claim & Reputation + Recalculate & Save Story
            claimToSave.save(null, masterKeyOption).then(function (claim) {
                return reputableStory.save(null, masterKeyOption);
            }).then(function (reputation) {
                story.set(FoodieStory.discoverabilityKey, reputation.calculateStoryScore());
                story.set(FoodieStory.reputationKey, reputation);
                return story.save(null, masterKeyOption);
            }).then(function (story) {
                // Success!
                callback(story.get(FoodieStory.reputationKey), "");
            }, function (error) {
                debugConsole.log(SeverityEnum.Warning, "claimInputForStory() Failed - " + error.code + " " + error.message);
                callback(null, "claimInputForStory() Failed - " + error.code + " " + error.message);
            });
        }
        else if (claimsToDelete.length >= 1) {
            // Delete Claim(s), Save Reputation & Recalculate & Save Story
            Parse.Object.destroyAll(claimsToDelete, masterKeyOption).then(function () {
                return reputableStory.save(null, masterKeyOption);
            }).then(function (reputation) {
                story.set(FoodieStory.discoverabilityKey, reputation.calculateStoryScore());
                story.set(FoodieStory.reputationKey, reputation);
                return story.save(null, masterKeyOption);
            }).then(function (story) {
                // Success!
                callback(story.get(FoodieStory.reputationKey), "");
            }, function (error) {
                debugConsole.log(SeverityEnum.Warning, "claimInputForStory() Failed - " + error.code + " " + error.message);
                callback(null, "claimInputForStory() Failed - " + error.code + " " + error.message);
            });
        }
        else {
            // Nothing needs to be done, respond with Success
            callback(reputableStory, "");
        }
    }, function (error) {
        debugConsole.log(SeverityEnum.Warning, "claimInputForStory() Failed - " + error.code + " " + error.message);
        callback(null, "claimInputForStory() Failed - " + error.code + " " + error.message);
    });
}
//
//  reputableClaim.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
var ReputationClaimTypeEnum;
//
//  reputableClaim.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
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
    // MARK: - Public Static Functions
    static createStoryReactionIfNotFound(reporterId, storyId, reactionType, claimsHistory) {
        debugConsole.log(SeverityEnum.Verbose, "reputableClaim.ts - createStoryReactionIfNotFound() executed");
        // Look at the claims history for already set reactions
        let existingReactions = claimsHistory.filter(claim => (claim.get(ReputableClaim.claimTypeKey) === ReputationClaimTypeEnum.StoryClaim &&
            claim.get(ReputableClaim.storyClaimTypeKey) === StoryClaimTypeEnum.Reaction));
        let matchingReactions = existingReactions.filter(reaction => (reaction.get(ReputableClaim.storyReactionTypeKey) === reactionType));
        // ??? Should we enforce 1 reaction type per user?
        let logSeverity = SeverityEnum.Verbose;
        if (existingReactions.length > 1 || matchingReactions.length > 0) {
            logSeverity = SeverityEnum.Warning;
        }
        debugConsole.log(logSeverity, "Set reaction type " + reactionType + " for storyID: " + storyId + " found " + existingReactions.length + " reactions & " + matchingReactions.length + " matches");
        if (matchingReactions.length < 1) {
            // No matching reactions found, create a new reaction
            let claim = new ReputableClaim();
            claim.setAsStoryReaction(reporterId, storyId, reactionType);
            return claim;
        }
        else {
            // Matching reaction found, do nothing
            return null;
        }
    }
    static deleteStoryReactionIfFound(reporterId, storyId, reactionType, claimsHistory) {
        debugConsole.log(SeverityEnum.Verbose, "reputableClaim.ts deleteStoryReactionIfFound() executed");
        // Look at the claims history for already set reactions
        let existingReactions = claimsHistory.filter(claim => (claim.get(ReputableClaim.claimTypeKey) === ReputationClaimTypeEnum.StoryClaim &&
            claim.get(ReputableClaim.storyClaimTypeKey) === StoryClaimTypeEnum.Reaction));
        let matchingReactions = existingReactions.filter(reaction => (reaction.get(ReputableClaim.storyReactionTypeKey) === reactionType));
        // ??? Should we enforce 1 reaction type per user?
        let logSeverity = SeverityEnum.Verbose;
        if (existingReactions.length > 1 || matchingReactions.length < 1) {
            logSeverity = SeverityEnum.Warning;
        }
        debugConsole.log(logSeverity, "Clear reaction type " + reactionType + " for storyID: " + storyId + " found " + existingReactions.length + " reactions & " + matchingReactions.length + " matches");
        return matchingReactions;
    }
    static createStoryActionIfNotFound(reporterId, storyId, actionType, claimsHistory) {
        debugConsole.log(SeverityEnum.Verbose, "reputableClaim.ts - createStoryActionIfNotFound() executed");
        // Look at the claims history for already set reactions
        let matchingClaims = claimsHistory.filter(claim => (claim.get(ReputableClaim.claimTypeKey) === ReputationClaimTypeEnum.StoryClaim &&
            claim.get(ReputableClaim.storyClaimTypeKey) === StoryClaimTypeEnum.StoryAction &&
            claim.get(ReputableClaim.storyActionTypeKey) === actionType));
        let logSeverity = SeverityEnum.Verbose;
        if (matchingClaims.length > 1) {
            logSeverity = SeverityEnum.Warning;
        }
        debugConsole.log(logSeverity, "Set action type " + actionType + " for storyID: " + storyId + " found " + matchingClaims.length + " matches");
        if (matchingClaims.length < 1) {
            // No matching reactions found, create a new reaction
            let claim = new ReputableClaim();
            claim.setAsStoryAction(reporterId, storyId, actionType);
            return claim;
        }
        else {
            // Matching claim(s) found, do nothing
            return null;
        }
    }
    static updateStoryViewClaim(reporterId, storyId, momentNumber, claimsHistory) {
        debugConsole.log(SeverityEnum.Verbose, "reputableClaim.ts - createStoryActionIfNotFound() executed");
        // Look at the claims history for already set reactions
        let matchingClaims = claimsHistory.filter(claim => (claim.get(ReputableClaim.claimTypeKey) === ReputationClaimTypeEnum.StoryClaim &&
            claim.get(ReputableClaim.storyClaimTypeKey) === StoryClaimTypeEnum.StoryViewed));
        let logSeverity = SeverityEnum.Verbose;
        if (matchingClaims.length > 1) {
            logSeverity = SeverityEnum.Warning;
        }
        debugConsole.log(logSeverity, "Set moment number to " + momentNumber + " for storyID: " + storyId + " found " + matchingClaims.length + " matches");
        if (matchingClaims.length < 1) {
            // No matching view claim found. Create a new one
            let claim = new ReputableClaim();
            claim.setAsStoryViewed(reporterId, storyId, momentNumber);
            return { claim: claim, prevMomentNumber: null, newMomentNumber: momentNumber };
        }
        else {
            let claim = matchingClaims[0];
            let prevMomentNumber = claim.get(ReputableClaim.storyMomentNumberKey);
            debugConsole.log(SeverityEnum.Verbose, "Previous Adjusted Moment Number is " + prevMomentNumber + ", New Adjusted Moment Number is " + momentNumber);
            if (momentNumber > prevMomentNumber) {
                claim.set(ReputableClaim.storyMomentNumberKey, momentNumber);
                return { claim: claim, prevMomentNumber: prevMomentNumber, newMomentNumber: momentNumber };
            }
            else {
                return { claim: null, prevMomentNumber: prevMomentNumber, newMomentNumber: momentNumber };
            }
        }
    }
    // MARK: - Public Instance Functions
    setAsStoryReaction(reporterId, storyId, reactionType) {
        this.set(ReputableClaim.sourceIdKey, reporterId);
        this.set(ReputableClaim.targetIdKey, storyId);
        this.set(ReputableClaim.claimTypeKey, ReputationClaimTypeEnum.StoryClaim);
        this.set(ReputableClaim.storyClaimTypeKey, StoryClaimTypeEnum.Reaction);
        this.set(ReputableClaim.storyReactionTypeKey, reactionType);
    }
    setAsStoryAction(reporterId, storyId, actionType) {
        this.set(ReputableClaim.sourceIdKey, reporterId);
        this.set(ReputableClaim.targetIdKey, storyId);
        this.set(ReputableClaim.claimTypeKey, ReputationClaimTypeEnum.StoryClaim);
        this.set(ReputableClaim.storyClaimTypeKey, StoryClaimTypeEnum.StoryAction);
        this.set(ReputableClaim.storyActionTypeKey, actionType);
    }
    setAsStoryViewed(reporterId, storyId, momentNumber) {
        this.set(ReputableClaim.sourceIdKey, reporterId);
        this.set(ReputableClaim.targetIdKey, storyId);
        this.set(ReputableClaim.claimTypeKey, ReputationClaimTypeEnum.StoryClaim);
        this.set(ReputableClaim.storyClaimTypeKey, StoryClaimTypeEnum.StoryViewed);
        this.set(ReputableClaim.storyMomentNumberKey, momentNumber);
    }
}
// MARK: - Public Static Properties
ReputableClaim.sourceIdKey = "sourceId";
ReputableClaim.targetIdKey = "targetId";
ReputableClaim.claimTypeKey = "claimType";
// For Story Reputation Claims
ReputableClaim.storyClaimTypeKey = "storyClaimType";
ReputableClaim.storyReactionTypeKey = "storyReactionType";
ReputableClaim.storyActionTypeKey = "storyActionType";
ReputableClaim.storyMomentNumberKey = "storyMomentNumber";
Parse.Object.registerSubclass("ReputableClaim", ReputableClaim);
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
    // MARK: - Constructor
    constructor(baseScore, percentageLikedWeighting, avgMomentWeighting, usersViewedWeighting, percentageSwipedWeighting, percentageClickedProfileWeighting, percentageClickedVenueWeighting, newnessFactor, newnessHalfLife, decayHalfLife, avgMomentNormalizeConstant, usersViewedNormalizeLogConstant) {
        this.baseScore = baseScore;
        this.percentageLikedWeighting = percentageLikedWeighting;
        this.avgMomentWeighting = avgMomentWeighting;
        this.usersViewedWeighting = usersViewedWeighting;
        this.percentageSwipedWeighting = percentageSwipedWeighting;
        this.percentageClickedProfileWeighting = percentageClickedProfileWeighting;
        this.percentageClickedVenueWeighting = percentageClickedVenueWeighting;
        this.newnessFactor = newnessFactor;
        this.newnessHalfLife = newnessHalfLife;
        this.decayHalfLife = decayHalfLife;
        this.avgMomentNormalizeConstant = avgMomentNormalizeConstant;
        this.usersViewedNormalizeLogConstant = usersViewedNormalizeLogConstant;
    }
    // MARK: - Public Instance Properties
    calculate(story, reputation) {
        const msInDay = 24 * 60 * 60 * 1000;
        let currentDate = new Date();
        let creationTime = story.createdAt.getTime() / msInDay;
        let currentTime = currentDate.getTime() / msInDay;
        let storyAge = currentTime - creationTime; // This is in days
        debugConsole.log(SeverityEnum.Verbose, "Quality Score Calculation timestamp: " + currentDate.toUTCString() + " in Days" + currentTime + ",  creationDays: " + creationTime);
        // Let's see how much Newness Boost there is
        // Boost Score = Newness Factor x 1/(2^time)
        let newnessBoost = this.newnessFactor * 1 / Math.pow(2, storyAge);
        debugConsole.log(SeverityEnum.Verbose, "Newness Boost for storyID: " + story.id + " = " + newnessBoost);
        // Let's calculate the Quality Component Score!!
        // User Views logarithmic normalization
        // User View Component Score = 1 - 1/log20(time + 20), where 20 is an example normalization constant
        let usersViewed = reputation.getUsersViewed();
        let usersViewedNormalized = 1 - 1 / (Math.log(usersViewed + this.usersViewedNormalizeLogConstant) / Math.log(this.usersViewedNormalizeLogConstant));
        let usersViewedWeighted = this.usersViewedWeighting * usersViewedNormalized;
        debugConsole.log(SeverityEnum.Verbose, "Users Viewed Weighted for storyID: " + story.id + " = " + usersViewedWeighted);
        // Calculate the average number of Moments viewed
        let avgMomentsViewed = reputation.getTotalMomentNumber() / reputation.getUsersViewed();
        // Moment number inverse normalization
        let avgMomentsNormalized = this.normalizeAvgMoment(avgMomentsViewed);
        let avgMomentsWeighted = this.avgMomentWeighting * avgMomentsNormalized;
        debugConsole.log(SeverityEnum.Verbose, "Avg Moments Weighted for storyID: " + story.id + " = " + avgMomentsWeighted);
        let percentageLiked = reputation.getUsersLiked() / reputation.getUsersViewed();
        let percentageLikedWeighted = this.percentageLikedWeighting * percentageLiked;
        let percentageSwiped = reputation.getUsersSwipedUp() / reputation.getUsersViewed();
        let percentageSwipedWeighted = this.percentageSwipedWeighting * percentageSwiped;
        let percentageClickedProfile = reputation.getUsersClickedProfile() / reputation.getUsersViewed();
        let percentageClickedProfileWeighted = this.percentageClickedProfileWeighting * percentageClickedProfile;
        let percentageClickedVenue = reputation.getUsersClickedVenue() / reputation.getUsersViewed();
        let percentageClickedVenueWeighted = this.percentageClickedVenueWeighting * percentageClickedVenue;
        // Finally the Quality Component Score!!
        let qualityComponent = this.baseScore +
            percentageLikedWeighted +
            percentageSwipedWeighted +
            percentageClickedProfileWeighted +
            percentageClickedVenueWeighted +
            usersViewedWeighted +
            avgMomentsWeighted;
        debugConsole.log(SeverityEnum.Verbose, "Quality Component for storyID: " + story.id + " = " + qualityComponent);
        // Apply Quality Decay Half Life
        let decayedQuality = qualityComponent * 1 / Math.pow(2, storyAge / this.decayHalfLife);
        debugConsole.log(SeverityEnum.Verbose, "Decayed Quality for storyID: " + story.id + " = " + decayedQuality);
        let totalScore = newnessBoost + decayedQuality;
        debugConsole.log(SeverityEnum.Verbose, "Total Quality Score for storyID: " + story.id + " = " + totalScore);
        return totalScore;
    }
    normalizeUsersViewed(usersViewed) {
        return 1 - 1 / (Math.log(usersViewed + this.usersViewedNormalizeLogConstant) / Math.log(this.usersViewedNormalizeLogConstant));
    }
    normalizeAvgMoment(avgMoment) {
        return 1 - 1 / (this.avgMomentNormalizeConstant * avgMoment + 1);
    }
}
ScoreStoryMetric.initialScore = 100; // 90 on max Newness Boost + 10 on base quality score
ScoreStoryMetric.defaultScore = 65; // Random middle of the road score
// MARK: - Defining Scoring Metric Versions
ScoreStoryMetric.scoreMetricVer = [
    null,
    // Story Scoring Metric ver. 1
    new ScoreStoryMetric(10, // baseScore: number;
    40, // percentageLikedWeighting: number;
    30, // avgMomentWeighting: number;
    30, // usersViewedWeighting: number;
    20, // percentageSwipedWeighting: number;
    10, // percentageClickedProfileWeighting: number;
    10, // percentageClickedVenueWeighting: number;
    90, // newnessFactor: number;
    1.0, // newnessHalfLife: number; (in days)
    120, // decayHalfLife: number; (in days)
    0.3, // avgMomentNormalizeConstant: number;
    20) // usersViewedNormalizeLogConstant: number;
];
