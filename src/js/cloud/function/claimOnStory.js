//
//  claimOnStory.js
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//
"use strict";
Parse.Cloud.define("storyClaim", function (req, res) {
    debugPrint.log(SeverityEnum.Debug, "claimOnStory.js ParseCloudFunction 'storyClaim' triggered");
    // Then we gotta establish who the reporter is first
    let user = undefined;
    if (req.user != undefined) {
        user = req.user;
    }
    else if (req.master === true) {
        user = null;
        debugPrint.log(SeverityEnum.Warning, "'storyClaim' called with master not yet supported!!");
        res.error("User-less Claim via Master Key not yet supported");
        return;
    }
    else {
        debugPrint.log(SeverityEnum.Warning, "'storyClaim' called with no source reporter!!");
        res.error("A source reporter is required to make a Reputation Claim against a Story");
        return;
    }
    // Extract storyId and claim type
    let storyId = req.params.storyId;
    let reporterId = user.get("objectId");
    inputClaimOnStory(storyId, reporterId, req.params);
});
function claimInputForStory(storyId, reporterId, claimParameters) {
    debugPrint.log(SeverityEnum.Debug, "claimOnStory.js claimInputForStory() executed");
    // To understand what action needs to be taken for the new claim inputClaimOnStory
    // We have to first query the ReputableClaim database
    // let ReputableClaim = Parse.Object.extend("ReputableClaim");
    let query = new Parse.Query(ReputableClaim);
    query.equalTo("source", reporterId);
    query.equalTo("target", storyId);
    query.find().then(function (results) {
        debugPrint.log(SeverityEnum.Debug, "Found " + claimsHistory.length + " matching Claims");
        updateStoryClaims(storyId, reporterId, claimParameters, results);
    }, function (error) {
        deubgPrint.log(SeverityEnum.Warning, "Parse Query failed at claimInputForStory(): " + error.code + " " + error.message);
        res.error("Parse Query failed at claimInputForStory(): " + error.code + " " + error.message);
    });
}
function updateClaimsForStory(storyId, reporterId, claimParameters, claimsHistory) {
    debugPrint.log(SeverityEnum.Debug, "claimOnStory.js updateClaimsForStory() executed");
    // Determine the exact claim scenario, then extract the relevant
    // parameters and supply it into the next claim processing function
    switch (claimParameters.storyClaimType) {
        case "reaction":
            if (claimParameters.setNotClear) {
                storySetReactionClaim(claimParameters.reactionType, claimsHistory);
            }
            else {
                storyClearReactionClaim(claimParameters.reactionType, claimsHistory);
            }
            break;
        case "storyAction":
            storyActionClaim(claimParameters.actionType, claimsHistory);
            break;
        case "storyViewed":
            storyViewedClaim(claimParameters.momentNum, claimsHistory);
            break;
    }
    // Update Roll-up of the target Story if necassary
    // Respond to the Client with a copy of the updated Story Reputation
}
function storySetReactionClaim(reactionType, claimsHistory) {
    // Look at the claims history for already set reactions
    let existingReactions = claimsHistory.filter(claim => (claim.get("type") === ReputableClaimTypeEnum.StoryClaim &&
        claim.get("storyClaimType") === StoryClaimTypeEnum.Reaction));
    // Just create a new Reputable Reaction Claim if no previous Reactions found
    if (existingReactions === null) {
        let storyReactionClaim = new ReputableClaim();
        storyReactionClaim.set("type", ReputableClaimTypeEnum.StoryClaim);
        storyReactionClaim.set("storyClaimType", StoryCLaimTypeEnum.Reaction);
        storyReactionClaim.set("reactionType", reactionType);
    }
}
function storyClearReactionClaim(reactionType, claimsHistory) {
}
function storyActionClaim(actionType, claimsHistory) {
}
function storyViewedClaim(momentNumber, claimsHistory) {
}
