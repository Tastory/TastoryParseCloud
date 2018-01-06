//
//  reputableClaim.js
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

  constructor() {
    super("ReputableClaim");
  }

  setAsStoryReaction(reporterId: string, storyId: string, reactionType: StoryReactionTypeEnum) {
    this.set("sourceId", reporterId);
    this.set("targetId", storyId);
    this.set("claimType", ReputationClaimTypeEnum.StoryClaim);
    this.set("storyClaimType", StoryClaimTypeEnum.Reaction);
    this.set("reactionType", reactionType);
  }

  setAsStoryAction(reporterId: string, storyId: string, actionType: StoryActionTypeEnum) {
    this.set("sourceId", reporterId);
    this.set("targetId", storyId);
    this.set("claimType", ReputationClaimTypeEnum.StoryClaim);
    this.set("storyClaimType", StoryClaimTypeEnum.StoryAction);
    this.set("actionType", actionType);
  }

  setAsStoryViewed(reporterId: string, storyId: string, momentNumber: Number) {
    this.set("sourceId", reporterId);
    this.set("targetId", storyId);
    this.set("claimType", ReputationClaimTypeEnum.StoryClaim);
    this.set("storyClaimType", StoryClaimTypeEnum.StoryViewed);
    this.set("momentNumber", momentNumber);
  }
}

Parse.Object.registerSubclass("ReputableClaim", ReputableClaim);
