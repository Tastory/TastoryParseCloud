//
//  claimOnStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

Parse.Cloud.define("storyClaim", function(req, res) {

  debugConsole.log(SeverityEnum.Debug, "claimOnStory.ts ParseCloudFunction 'storyClaim' triggered");

  // Then we gotta establish who the reporter is first
  let user = undefined;

  if (req.user != undefined) {
    user = req.user;

  } else if (req.master === true) {
    user = null;
    debugConsole.log(SeverityEnum.Warning, "'storyClaim' called with master not yet supported!!");
    res.error("User-less Claim via Master Key not yet supported");
    return;

  } else {
    debugConsole.log(SeverityEnum.Warning, "'storyClaim' called with no source reporter!!");
    res.error("A source reporter is required to make a Reputation Claim against a Story");
    return;
  }

  // Extract storyId and claim type
  let storyId: string = req.params.storyId;
  let reporterId: string = user.id;

  // Process the claim input
  claimInputForStory(reporterId, storyId, req.params, function(anyArg: any, errorMsg: string) {
    if (!errorMsg) {
      debugConsole.log(SeverityEnum.Warning, "errorMsg");
      res.error(errorMsg);

    } else {
      debugConsole.log(SeverityEnum.Debug, "ParseCloudFunction 'storyClaim' success response")
      res.success(anyArg);
    }
  });
});


function claimInputForStory(reporterId: string, storyId: string, claimParameters: any, callback: AnyErrorMsgFunction) {
  debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts " + claimInputForStory.name + "() executed");

  // To understand what action needs to be taken for the new claim inputClaimOnStory
  // We have to first query the ReputableClaim database
  // let ReputableClaim = Parse.Object.extend("ReputableClaim");
  let query = new Parse.Query(ReputableClaim);
  query.equalTo("sourceId", reporterId);
  query.equalTo("targetId", storyId);
  query.find().then(

    function(results) {
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
    },

    function(error) {
      debugConsole.log(SeverityEnum.Warning, "Parse query failed at " + claimInputForStory.name + "(): " + error.code + " " + error.message);
      callback(null, "Parse Query failed at claimInputForStory(): " + error.code + " " + error.message);
    }
  );
}


function storySetReactionClaim(reporterId: string, storyId: string, reactionType: StoryReactionTypeEnum, claimsHistory: ReputableClaim[], callback: AnyErrorMsgFunction) {
  debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts - storySetReactionClaim() executed");

  for (let claim of claimsHistory) {
    debugConsole.log(SeverityEnum.Verbose, "Claim Type: " + claim.claimType + " StoryClaimType: " + claim.storyClaimType);
  }

  // Look at the claims history for already set reactions
  let existingReactions = claimsHistory.filter(claim => (claim.claimType === ReputationClaimTypeEnum.StoryClaim &&
                                                         claim.storyClaimType === StoryClaimTypeEnum.Reaction));

  debugConsole.log(SeverityEnum.Debug, "StoyReaction filter resulted in " + existingReactions.length + " matches");

  // Do all operations against Parse via Master key. As the ReputableClaim class is restricted
  let masterKeyOption: Parse.UseMasterKeyOption = { useMasterKey: true };

  // No previous Reactions found, just set and save a new Reaction
  if (existingReactions.length === 0) {
    let storyReactionClaim = new ReputableClaim();
    storyReactionClaim.setAsStoryReaction(reporterId, storyId, reactionType);
    debugConsole.log(SeverityEnum.Verbose, "No previous Reactions found by " + reporterId + " against " + storyId + "saving a new Story Reaction Claim");

    storyReactionClaim.save(null, masterKeyOption).then(function(object) {
      // TODO: - Do Roll-up Here, or do it as a then case
      // For now, just log and returned. Also note returned object isn't even correct
      debugConsole.log(SeverityEnum.Verbose, "Parse save new Story Reaction success. Calling back for now");
      callback(object, "Parse save new Story Reaction Success");

    }, function(error) {
      debugConsole.log(SeverityEnum.Warning, "Parse save new Story Reaction failed at storySetReactionClaim(): " + error.code + " " + error.message);
      callback(null, "Parse save new Story Reaction failed at storySetReactionClaim(): " + error.code + " " + error.message);
    });
  }

  // Previous Reactions found
  else {
    debugConsole.log(SeverityEnum.Verbose, existingReactions.length + " Reactions found by " + reporterId + " to " + storyId);
    let sameReaction = existingReactions.filter(reaction => (reaction.get("reactionType") === reactionType));

    // Not the same Reaction, clear, set then save a new Reaction
    if (existingReactions.length != 1 || sameReaction.length != 0) {
      let storyReactionClaim = new ReputableClaim();
      storyReactionClaim.setAsStoryReaction(reporterId, storyId, reactionType);
      debugConsole.log(SeverityEnum.Verbose, "Clear and saving a new Story Reaction Claim");

      Parse.Object.destroyAll(existingReactions, masterKeyOption).then(function() {
        return storyReactionClaim.save(null, masterKeyOption);

      }).then(function(object) {
        // TODO: - Do Roll-up Here, or do it as a then case
        // For now, just log and returned. Also note returned object isn't even correct
        debugConsole.log(SeverityEnum.Verbose, "Parse clear & save new Story Reaction success. Calling back for now");
        callback(object, "Parse clear & save new Story Reaction Success");

      }, function(error) {
        debugConsole.log(SeverityEnum.Warning, "Parse clear & save new Story Reaction failed at storySetReactionClaim(): " + error.code + " " + error.message);
        callback(null, "Parse clear & save new Story Reaction failed at storySetReactionClaim(): " + error.code + " " + error.message);
      });

    // Exiting Reaction matches the Desired Reaction
    } else {
      // TODO: For now, just log and returned. Also note returned object isn't even correct
      debugConsole.log(SeverityEnum.Verbose, "Desired Reaction state already exist. Calling back for now");
      callback(null, "Desired Reaction state already exist. Success");
    }
  }
}


function storyClearReactionClaim(reporterId: string, storyId: string, reactionType: StoryReactionTypeEnum, claimsHistory: ReputableClaim[], callback: AnyErrorMsgFunction) {
  debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts " + storyClearReactionClaim.name + "() executed");
}


function storyActionClaim(reporterId: string, storyId: string, actionType: StoryActionTypeEnum, claimsHistory: ReputableClaim[], callback: AnyErrorMsgFunction) {
  debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts " + storyActionClaim.name + "() executed");
}


function storyViewedClaim(reporterId: string, storyId: string, momentNumber: number, claimsHistory: ReputableClaim[], callback: AnyErrorMsgFunction) {
  debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts " + storyViewedClaim.name + "() executed");
}
