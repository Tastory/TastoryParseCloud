//
//  reputableClaim.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//

enum ReputationClaimTypeEnum {
  StoryClaim = "storyClaim"
}

enum StoryClaimTypeEnum {
  Reaction = 1,
  StoryAction = 2,
  StoryViewed = 3
}

enum StoryReactionTypeEnum {
  Like = 1
};

enum StoryActionTypeEnum {
  Swiped = 1,
  Venue = 2,
  Profile = 3,
  Shared = 4,
  Bookmark = 5
};


class ReputableClaim extends Parse.Object {

  // MARK: - Public Static Properties
  static sourceIdKey: string = "sourceId";
  static targetIdKey: string = "targetId";
  static claimTypeKey: string = "claimType";

  // For Story Reputation Claims
  static storyClaimTypeKey: string = "storyClaimType";
  static storyReactionTypeKey: string = "storyReactionType";
  static storyActionTypeKey: string = "storyActionType";
  static storyMomentNumberKey: string = "storyMomentNumber";

  constructor() {
    super("ReputableClaim");
  }


  // MARK: - Public Static Functions
  static createStoryReactionIfNotFound(reporterId: string, storyId: string, reactionType: StoryReactionTypeEnum, claimsHistory: ReputableClaim[]): ReputableClaim | null {
    debugConsole.log(SeverityEnum.Verbose, "reputableClaim.ts - createStoryReactionIfNotFound() executed");

    // Look at the claims history for already set reactions
    let existingReactions = claimsHistory.filter(claim => (claim.get(ReputableClaim.claimTypeKey) === ReputationClaimTypeEnum.StoryClaim &&
                                                           claim.get(ReputableClaim.storyClaimTypeKey) === StoryClaimTypeEnum.Reaction));
    let matchingReactions = existingReactions.filter(reaction => (reaction.get(ReputableClaim.storyReactionTypeKey) === reactionType));

    // ??? Should we enforce 1 reaction type per user?
    if (existingReactions.length > 1 || matchingReactions.length > 0) {
      debugConsole.error("Set reaction type " + reactionType + " for storyID: " + storyId + " found " + existingReactions.length + " reactions & " + matchingReactions.length + " matches");
    } else {
      debugConsole.log(SeverityEnum.Verbose, "Set reaction type " + reactionType + " for storyID: " + storyId + " found " + existingReactions.length + " reactions & " + matchingReactions.length + " matches");
    }

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


  static deleteStoryReactionIfFound(reporterId: string, storyId: string, reactionType: StoryReactionTypeEnum, claimsHistory: ReputableClaim[]): ReputableClaim[] {
    debugConsole.log(SeverityEnum.Verbose, "reputableClaim.ts deleteStoryReactionIfFound() executed");

    // Look at the claims history for already set reactions
    let existingReactions = claimsHistory.filter(claim => (claim.get(ReputableClaim.claimTypeKey) === ReputationClaimTypeEnum.StoryClaim &&
                                                           claim.get(ReputableClaim.storyClaimTypeKey) === StoryClaimTypeEnum.Reaction));
    let matchingReactions = existingReactions.filter(reaction => (reaction.get(ReputableClaim.storyReactionTypeKey) === reactionType));

    // ??? Should we enforce 1 reaction type per user?
    if (existingReactions.length > 1 || matchingReactions.length < 1) {
      debugConsole.error("Clear reaction type " + reactionType + " for storyID: " + storyId + " found " + existingReactions.length + " reactions & " + matchingReactions.length + " matches");
    } else {
      debugConsole.log(SeverityEnum.Verbose, "Clear reaction type " + reactionType + " for storyID: " + storyId + " found " + existingReactions.length + " reactions & " + matchingReactions.length + " matches");
    }
    return matchingReactions;
  }


  static createStoryActionIfNotFound(reporterId: string, storyId: string, actionType: StoryActionTypeEnum, claimsHistory: ReputableClaim[]): ReputableClaim | null {
    debugConsole.log(SeverityEnum.Verbose, "reputableClaim.ts - createStoryActionIfNotFound() executed");

    // Look at the claims history for already set reactions
    let matchingClaims = claimsHistory.filter(claim => (claim.get(ReputableClaim.claimTypeKey) === ReputationClaimTypeEnum.StoryClaim &&
                                                        claim.get(ReputableClaim.storyClaimTypeKey) === StoryClaimTypeEnum.StoryAction &&
                                                        claim.get(ReputableClaim.storyActionTypeKey) === actionType));

    if (matchingClaims.length > 1) {
      debugConsole.error("Set action type " + actionType + " for storyID: " + storyId + " found " + matchingClaims.length + " matches");
    } else {
      debugConsole.log(SeverityEnum.Verbose, "Set action type " + actionType + " for storyID: " + storyId + " found " + matchingClaims.length + " matches");
    }

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


  static updateStoryViewClaim(reporterId: string, storyId: string, momentNumber: number, claimsHistory: ReputableClaim[]): { claim: ReputableClaim | null, prevMomentNumber: number | null, newMomentNumber: number } {
    debugConsole.log(SeverityEnum.Verbose, "reputableClaim.ts - createStoryActionIfNotFound() executed");

    // Look at the claims history for already set reactions
    let matchingClaims = claimsHistory.filter(claim => (claim.get(ReputableClaim.claimTypeKey) === ReputationClaimTypeEnum.StoryClaim &&
                                                        claim.get(ReputableClaim.storyClaimTypeKey) === StoryClaimTypeEnum.StoryViewed));

    if (matchingClaims.length > 1) {
      debugConsole.error("Set moment number to " + momentNumber + " for storyID: " + storyId + " found " + matchingClaims.length + " matches");
    } else {
      debugConsole.log(SeverityEnum.Verbose, "Set moment number to " + momentNumber + " for storyID: " + storyId + " found " + matchingClaims.length + " matches");
    }

    if (matchingClaims.length < 1) {
      // No matching view claim found. Create a new one
      let claim = new ReputableClaim();
      claim.setAsStoryViewed(reporterId, storyId, momentNumber);
      return { claim: claim, prevMomentNumber: null, newMomentNumber: momentNumber }
    }
    else {
      let claim = matchingClaims[0];
      let prevMomentNumber = claim.get(ReputableClaim.storyMomentNumberKey);
      debugConsole.log(SeverityEnum.Verbose, "Previous Adjusted Moment Number is " + prevMomentNumber + ", New Adjusted Moment Number is " + momentNumber);

      if (momentNumber > prevMomentNumber) {
        claim.set(ReputableClaim.storyMomentNumberKey, momentNumber);
        return { claim: claim, prevMomentNumber: prevMomentNumber, newMomentNumber: momentNumber }
      } else {
        return { claim: null, prevMomentNumber: prevMomentNumber, newMomentNumber: momentNumber }
      }
    }
  }


  // MARK: - Public Instance Functions
  setAsStoryReaction(reporterId: string, storyId: string, reactionType: StoryReactionTypeEnum) {
    this.set(ReputableClaim.sourceIdKey, reporterId);
    this.set(ReputableClaim.targetIdKey, storyId);
    this.set(ReputableClaim.claimTypeKey, ReputationClaimTypeEnum.StoryClaim);
    this.set(ReputableClaim.storyClaimTypeKey, StoryClaimTypeEnum.Reaction);
    this.set(ReputableClaim.storyReactionTypeKey, reactionType);
  }

  setAsStoryAction(reporterId: string, storyId: string, actionType: StoryActionTypeEnum) {
    this.set(ReputableClaim.sourceIdKey, reporterId);
    this.set(ReputableClaim.targetIdKey, storyId);
    this.set(ReputableClaim.claimTypeKey, ReputationClaimTypeEnum.StoryClaim);
    this.set(ReputableClaim.storyClaimTypeKey, StoryClaimTypeEnum.StoryAction);
    this.set(ReputableClaim.storyActionTypeKey, actionType);
  }

  setAsStoryViewed(reporterId: string, storyId: string, momentNumber: Number) {
    this.set(ReputableClaim.sourceIdKey, reporterId);
    this.set(ReputableClaim.targetIdKey, storyId);
    this.set(ReputableClaim.claimTypeKey, ReputationClaimTypeEnum.StoryClaim);
    this.set(ReputableClaim.storyClaimTypeKey, StoryClaimTypeEnum.StoryViewed);
    this.set(ReputableClaim.storyMomentNumberKey, momentNumber);
  }
}

Parse.Object.registerSubclass("ReputableClaim", ReputableClaim);
