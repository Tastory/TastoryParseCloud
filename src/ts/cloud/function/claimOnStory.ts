//
//  claimOnStory.js
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

Parse.Cloud.define("storyClaim", function(req, res) {
  debugConsole.log(SeverityEnum.Debug, "claimOnStory.js ParseCloudFunction 'storyClaim' triggered");

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
  let reporterId: string = user.get("objectId");

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
  debugConsole.log(SeverityEnum.Verbose, "claimOnStory.js " + claimInputForStory.name + "() executed");

  // To understand what action needs to be taken for the new claim inputClaimOnStory
  // We have to first query the ReputableClaim database
  // let ReputableClaim = Parse.Object.extend("ReputableClaim");
  let query = new Parse.Query(ReputableClaim);

  query.equalTo("source", reporterId);
  query.equalTo("target", storyId);
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
      debugConsole.log(SeverityEnum.Warning, "Parse Query failed at claimInputForStory(): " + error.code + " " + error.message);
      callback(null, "Parse Query failed at claimInputForStory(): " + error.code + " " + error.message);
    }
  );
}


function storySetReactionClaim(reporterId: string, storyId: string, reactionType: StoryReactionTypeEnum, claimsHistory: ReputableClaim[], callback: AnyErrorMsgFunction) {
  debugConsole.log(SeverityEnum.Verbose, "claimOnStory.js " + storySetReactionClaim.name + "() executed");

  // Look at the claims history for already set reactions
  let existingReactions = claimsHistory.filter(claim => (claim.get("type") === ReputationClaimTypeEnum.StoryClaim &&
                                                         claim.get("storyClaimType") === StoryClaimTypeEnum.Reaction));

  debugConsole.log(SeverityEnum.Debug, "StoyReaction filter resulted in " + existingReactions.length + " matches");

  // Just create a new Reputable Reaction Claim if no previous Reactions found
  if (existingReactions === null) {
    let storyReactionClaim = new ReputableClaim();
    storyReactionClaim.setAsStoryReaction(reporterId, storyId, reactionType);

    // Save using Master Key here, as the entire class is restricted
    storyReactionClaim.save(null, { userMasterKey: true }).then(

      function() {

      }
    )

  }
}


function storyClearReactionClaim(reporterId: string, storyId: string, reactionType: StoryReactionTypeEnum, claimsHistory: ReputableClaim[], callback: AnyErrorMsgFunction) {
  debugConsole.log(SeverityEnum.Verbose, "claimOnStory.js " + storyClearReactionClaim.name + "() executed");
}


function storyActionClaim(reporterId: string, storyId: string, actionType: StoryActionTypeEnum, claimsHistory: ReputableClaim[], callback: AnyErrorMsgFunction) {
  debugConsole.log(SeverityEnum.Verbose, "claimOnStory.js " + storyActionClaim.name + "() executed");
}


function storyViewedClaim(reporterId: string, storyId: string, momentNumber: number, claimsHistory: ReputableClaim[], callback: AnyErrorMsgFunction) {
  debugConsole.log(SeverityEnum.Verbose, "claimOnStory.js " + storyViewedClaim.name + "() executed");
}
