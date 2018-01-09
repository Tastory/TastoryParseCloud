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
    if (!anyArg) {
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

  debugConsole.log(SeverityEnum.Debug, "Story Reputation Claim Input" +
                                       "\nSource ID: " + reporterId +
                                       "\nTarget ID: " + storyId +
                                       "\nStory Claim Type: " + claimParameters.storyClaimType +
                                       "\nSet or Clear: " + claimParameters.setNotClear +
                                       "\nReaction Type: " + claimParameters.reactionType +
                                       "\nAction Type: " + claimParameters.actionType +
                                       "\nMoment Number: " + claimParameters.momentNumber);

  // To understand what action needs to be taken for the new claim inputClaimOnStory
  // We have to first query the ReputableClaim database
  let query = new Parse.Query(ReputableClaim);
  query.equalTo("sourceId", reporterId);
  query.equalTo("targetId", storyId);
  query.find().then(

    function(results) {
      debugConsole.log(SeverityEnum.Debug, "ReputableClaim query resulted in " + results.length + " matches");

      // Determine the exact claim scenario, then extract the relevant
      // parameters and supply it into the next claim processing function

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

  // Look at the claims history for already set reactions
  let existingReactions = claimsHistory.filter(claim => (claim.get(ReputableClaim.claimTypeKey) === ReputationClaimTypeEnum.StoryClaim &&
                                                         claim.get(ReputableClaim.storyClaimTypeKey) === StoryClaimTypeEnum.Reaction));

  debugConsole.log(SeverityEnum.Debug, "StoryReaction filter resulted in " + existingReactions.length + " matches");

  // No previous Reactions found, just set and save a new Reaction
  if (existingReactions.length === 0) {
    let storyReactionClaim = new ReputableClaim();
    storyReactionClaim.setAsStoryReaction(reporterId, storyId, reactionType);
    debugConsole.log(SeverityEnum.Verbose, "No previous Reactions found by " + reporterId + " against " + storyId + " saving a new Story Reaction Claim");

    storyReactionClaim.save(null, masterKeyOption).then(
      function(object) {
        ReputableStory.incUsersLikedFor(storyId, callback);
      },

      function(error) {
        debugConsole.log(SeverityEnum.Warning, "Parse save new Story Reaction failed at storySetReactionClaim(): " + error.code + " " + error.message);
        callback(null, "Parse save new Story Reaction failed at storySetReactionClaim(): " + error.code + " " + error.message);
      }
    );
  }

  // Previous Reactions found
  else {
    if (existingReactions.length <= 1) {
      debugConsole.log(SeverityEnum.Verbose, existingReactions.length + " Reactions found by " + reporterId + " to " + storyId);
    } else {
      debugConsole.log(SeverityEnum.Warning, "Unexpected to find " + existingReactions.length + " Reactions by " + reporterId + " to " + storyId);
    }
    let matchingReactions = existingReactions.filter(reaction => (reaction.get(ReputableClaim.storyReactionTypeKey) === reactionType));

    // Not the same Reaction, clear, set then save a new Reaction
    if (existingReactions.length != 1 || matchingReactions.length != 0) {
      let storyReactionClaim = new ReputableClaim();
      storyReactionClaim.setAsStoryReaction(reporterId, storyId, reactionType);
      debugConsole.log(SeverityEnum.Verbose, "Clear and saving a new Story Reaction Claim");

      Parse.Object.destroyAll(existingReactions, masterKeyOption).then(function() {
        return storyReactionClaim.save(null, masterKeyOption);

      }).then(
        function(object) {
          ReputableStory.incUsersLikedFor(storyId, callback);
        },

        function(error) {
          debugConsole.log(SeverityEnum.Warning, "Parse clear & set Story Reaction failed at storySetReactionClaim(): " + error.code + " " + error.message);
          callback(null, "Parse clear & set Story Reaction failed at storySetReactionClaim(): " + error.code + " " + error.message);
        }
      );

    // Exiting Reaction matches the Desired Reaction
    } else {
      ReputableStory.getStoryWithLog(storyId).then(
        function(reputation) {
          debugConsole.log(SeverityEnum.Warning, "Desired Reaction state already exist. Calling back for now");
          callback(reputation, "Desired Reaction state already exist. Success");
        },
        function(error) {
          debugConsole.log(SeverityEnum.Warning, "Cannot even find StoryReputation at storyClearReactionClaim()");
          callback(null, "Cannot even find StoryReputation at storyClearReactionClaim()");
        }
      );
    }
  }
}


function storyClearReactionClaim(reporterId: string, storyId: string, reactionType: StoryReactionTypeEnum, claimsHistory: ReputableClaim[], callback: AnyErrorMsgFunction) {
  debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts " + storyClearReactionClaim.name + "() executed");

  // Look at the claims history for already set reactions
  let existingReactions = claimsHistory.filter(claim => (claim.get(ReputableClaim.claimTypeKey) === ReputationClaimTypeEnum.StoryClaim &&
                                                         claim.get(ReputableClaim.storyClaimTypeKey) === StoryClaimTypeEnum.Reaction));

  let matchingReactions = existingReactions.filter(reaction => (reaction.get(ReputableClaim.storyReactionTypeKey) === reactionType));
  debugConsole.log(SeverityEnum.Verbose, "StoryReaction filter for " + reactionType + " resulted in " + existingReactions.length + " existing Reactions & " + matchingReactions.length + " matches");

  // Why is the client even asking for a clear then?
  if (existingReactions.length === 0 || matchingReactions.length === 0) {
    ReputableStory.getStoryWithLog(storyId).then(
      function(reputation) {
        debugConsole.log(SeverityEnum.Warning, "Parse clear Story Reaction already cleared at storyClearReactionClaim()");
        callback(reputation, "Parse clear Story Reaction already cleared at storyClearReactionClaim()");
      },
      function(error) {
        debugConsole.log(SeverityEnum.Warning, "Cannot find StoryReputation at storyClearReactionClaim()" + error.code + " " + error.message);
        callback(null, "Cannot find StoryReputation at storyClearReactionClaim()" + error.code + " " + error.message);
      }
    );

  } else {
    Parse.Object.destroyAll(matchingReactions, masterKeyOption).then(
      function() {
        ReputableStory.decUsersLikedFor(storyId, callback);
      },

      function(error) {
        debugConsole.log(SeverityEnum.Warning, "Parse clear Story Reaction failed at storyClearReactionClaim(): " + error.code + " " + error.message);
        callback(null, "Parse clear Story Reaction failed at storyClearReactionClaim(): " + error.code + " " + error.message);
      }
    )
  }
}


function storyActionClaim(reporterId: string, storyId: string, actionType: StoryActionTypeEnum, claimsHistory: ReputableClaim[], callback: AnyErrorMsgFunction) {
  debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts " + storyActionClaim.name + "() executed");
}


function storyViewedClaim(reporterId: string, storyId: string, momentNumber: number, claimsHistory: ReputableClaim[], callback: AnyErrorMsgFunction) {
  debugConsole.log(SeverityEnum.Verbose, "claimOnStory.ts " + storyViewedClaim.name + "() executed");
}
