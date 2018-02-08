//
//  claimOnStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//

Parse.Cloud.define("storyClaim", function(req, res) {
  debugConsole.log(SeverityEnum.Debug, "claimOnStory.ts ParseCloudFunction 'storyClaim' triggered");

  // Then we gotta establish who the reporter is first
  let user = undefined;

  if (req.user != undefined) {
    user = req.user;

  } else if (req.master === true) {
    user = null;
    debugConsole.error("'storyClaim' called with master not yet supported!!");
    res.error("User-less Claim via Master Key not yet supported");
    return;

  } else {
    debugConsole.error("'storyClaim' called with no source reporter!!");
    res.error("A source reporter is required to make a Reputation Claim against a Story");
    return;
  }

  // Extract storyId and claim type
  let storyId: string = req.params.targetId;
  let reporterId: string = user.id;

  // Process the claim input
  claimInputForStory(reporterId, storyId, req.params, function(anyArg: any, errorMsg: string) {
    if (!anyArg) {
      debugConsole.error(errorMsg);
      res.error(errorMsg);

    } else {
      debugConsole.log(SeverityEnum.Debug, "ParseCloudFunction 'storyClaim' from: " + reporterId + " to: " + storyId + " success response")
      res.success(anyArg);
    }
  });
});


function claimInputForStory(reporterId: string, storyId: string, claimParameters: any, callback: AnyErrorMsgFunction) {
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
  let storyClaims: ReputableClaim[];
  let query = new Parse.Query(ReputableClaim);
  query.equalTo(ReputableClaim.sourceIdKey, reporterId);
  query.equalTo(ReputableClaim.targetIdKey, storyId);
  query.equalTo(ReputableClaim.claimTypeKey, ReputationClaimTypeEnum.StoryClaim);  // We are only dealing with Story Claims in this function

  query.find().then(function(claims) {
    debugConsole.log(SeverityEnum.Debug, "claimOnStory.ts found " + claims.length + " relevant ReputableClaims");
    storyClaims = claims;

    // Get the Story & associated Reputation here
    // Might want to refactor out if there are other claim types to support
    let query = new Parse.Query(FoodieStory);
    query.include(FoodieStory.reputationKey);
    return query.get(storyId);

  }).then(function(story) {
    let reputableStory: ReputableStory;

    // Extract the Reputation from the Story. Otherwise create a new ReputableStory object
    if (!story.get(FoodieStory.reputationKey)) {
      reputableStory = new ReputableStory();
      reputableStory.initializeReputation(story, reputationScoreStoryMetricVer);
    } else {
      reputableStory = story.get(FoodieStory.reputationKey);
      reputableStory.debugConsoleLog(SeverityEnum.Verbose);
    }
    reputableStory.story = story; // Important! This handle is not auto populated by Parse. Always manually populate!

    // Determine the claim scenario and action applicability
    // Find the immediate response cases before going into the next Promise chain
    let claimToSave: ReputableClaim | null = null;
    let claimsToDelete: ReputableClaim[] = [];

    switch (claimParameters.storyClaimType) {
      case StoryClaimTypeEnum.Reaction:

        if (claimParameters.setNotClear) {
          let reactionType = claimParameters.storyReactionType;
          claimToSave = ReputableClaim.createStoryReactionIfNotFound(reporterId, storyId, reactionType, storyClaims);  // Returns claim if created. Null if found

          if (claimToSave) { reputableStory.incReactions(reactionType); }
        }
        else {
          let reactionType = claimParameters.storyReactionType;
          claimsToDelete = ReputableClaim.deleteStoryReactionIfFound(reporterId, storyId, reactionType, storyClaims)  // Returns true if cleam deleted

          // No matter how many claims, just decrement only by 1 for now
          if (claimsToDelete.length >= 1) { reputableStory.decReactions(reactionType); }
        }
        break;

      case StoryClaimTypeEnum.StoryAction:
        let actionType = claimParameters.storyActionType;
        claimToSave = ReputableClaim.createStoryActionIfNotFound(reporterId, storyId, actionType, storyClaims);   // Returns claim if created. Null if found

        if (claimToSave) { reputableStory.incActions(actionType); }
        break;

      case StoryClaimTypeEnum.StoryViewed:
        let storyViewReturn = ReputableClaim.updateStoryViewClaim(reporterId, storyId, claimParameters.storyMomentNumber, storyClaims);   // Returns claim if created. Null if update not needed
        claimToSave = storyViewReturn.claim

        if (claimToSave) {
          if (storyViewReturn.prevMomentNumber) {
            reputableStory.recalMaxMomentNumber(storyViewReturn.prevMomentNumber, storyViewReturn.newMomentNumber);
          } else {
            reputableStory.addNewView(storyViewReturn.newMomentNumber);
          }
        }
        break;
    }

    if (claimToSave) {
      // Save Claim & Reputation + Recalculate & Save Story
      claimToSave.save(null, masterKeyOption).then(function(claim) {
        return reputableStory.save(null, masterKeyOption);

      }).then(function(reputation) {
        reputation.story = story;  // Just in case
        // Assume Recalculation will be performed in 'beforeSave' story.set(FoodieStory.discoverabilityKey, reputation.calculateStoryScore());
        story.set(FoodieStory.reputationKey, reputation);
        return story.save(null, masterKeyOption);

      }).then(function(story) {
        // Success!
        callback(story.get(FoodieStory.reputationKey), "");
      },

      function(error) {
        debugConsole.error("claimInputForStory() Failed - " + error.code + " " + error.message);
        callback(null, "claimInputForStory() Failed - " + error.code + " " + error.message);
      });
    }

    else if (claimsToDelete.length >= 1) {
      // Delete Claim(s), Save Reputation & Recalculate & Save Story
      Parse.Object.destroyAll(claimsToDelete, masterKeyOption).then(function() {
        return reputableStory.save(null, masterKeyOption);

      }).then(function(reputation) {
        reputation.story = story;  // Just in case
        // Assume Recalculation will be performed in 'beforeSave' story.set(FoodieStory.discoverabilityKey, reputation.calculateStoryScore());
        story.set(FoodieStory.reputationKey, reputation);
        return story.save(null, masterKeyOption);

      }).then(function(story) {
        // Success!
        callback(story.get(FoodieStory.reputationKey), "");
      },

      function(error) {
        debugConsole.error("claimInputForStory() Failed - " + error.code + " " + error.message);
        callback(null, "claimInputForStory() Failed - " + error.code + " " + error.message);
      });
    }

    else {
      // Nothing needs to be done, respond with Success
      callback(reputableStory, "");
    }
  },

  function(error) {
    debugConsole.error("claimInputForStory() Failed - " + error.code + " " + error.message);
    callback(null, "claimInputForStory() Failed - " + error.code + " " + error.message);
  });
}
