//
//  reputableStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

class ReputableStory extends Parse.Object {

   // MARK: - Public Static Properties
  static storyIdKey: string = "storyId";
  static scoreMetricVerKey: string = "scoreMetricVer";
  static usersViewedKey: string = "usersViewed";
  static usersLikedKey: string = "usersLiked";
  static usersSwipedUpKey: string = "usersSwipedUp";
  static usersClickedVenueKey: string = "usersClickedVenue";
  static usersClickedProfileKey: string = "usersClickedProfile";
  static totalMomentNumberKey: string = "totalMomentNumber";
  static totalViewsKey: string = "totalViews";


  // MARK: - Public Instance Properties
  story: FoodieStory;


  constructor() {
    super("ReputableStory");
  }


  // MARK: - Public Instance Functions
  initializeReputation(story: FoodieStory, scoreMetricVer: number) {
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


  debugConsoleLog(severity: SeverityEnum) {
    debugConsole.log(severity, "ReputableStory ID: " + this.id +
                               "\n" + ReputableStory.scoreMetricVerKey + ": " + this.get(ReputableStory.scoreMetricVerKey) +
                               "\n" + ReputableStory.usersViewedKey + ": " + this.get(ReputableStory.usersViewedKey) +
                               "\n" + ReputableStory.usersLikedKey + ": " + this.get(ReputableStory.usersLikedKey) +
                               "\n" + ReputableStory.usersSwipedUpKey + ": " + this.get(ReputableStory.usersSwipedUpKey) +
                               "\n" + ReputableStory.usersClickedVenueKey + ": " + this.get(ReputableStory.usersClickedVenueKey) +
                               "\n" + ReputableStory.usersClickedProfileKey + ": " + this.get(ReputableStory.usersClickedProfileKey) +
                               "\n" + ReputableStory.totalMomentNumberKey + ": " + this.get(ReputableStory.totalMomentNumberKey) +
                               "\n" + ReputableStory.totalViewsKey + ": " + this.get(ReputableStory.totalViewsKey));
  }


  // Explicit Claims
  incReactions(type: StoryReactionTypeEnum) {
    switch (type) {
      case StoryReactionTypeEnum.Like:
        this.incUsersLiked();
        break;
      // For future reaction types
    }
  }

  decReactions(type: StoryReactionTypeEnum) {
    switch (type) {
      case StoryReactionTypeEnum.Like:
        this.decUsersLiked();
        break;
      // For future reaction types
    }
  }

  incUsersLiked() {
    this.increment(ReputableStory.usersLikedKey);
  }

  decUsersLiked() {
    this.increment(ReputableStory.usersLikedKey, -1);
  }

  // Implicit Claims
  incActions(type: StoryActionTypeEnum) {
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
      // For future reaction types
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

  addNewView(momentNumber: number) {
    this.increment(ReputableStory.usersViewedKey);
    this.increment(ReputableStory.totalMomentNumberKey, momentNumber);
  }

  recalMaxMomentNumber(prevMomentNumber: number, newMomentNumber: number) {
    let momentOffset = newMomentNumber - prevMomentNumber;
    this.increment(ReputableStory.totalMomentNumberKey, momentOffset);
  }

  calculateStoryScore(): number {
    return (this.get(ReputableStory.usersLikedKey)*10)+20;
  }
}

Parse.Object.registerSubclass("ReputableStory", ReputableStory);
