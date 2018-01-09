//
//  reputableClaim.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
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
  Profile = 3
};


class ReputableClaim extends Parse.Object {

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
