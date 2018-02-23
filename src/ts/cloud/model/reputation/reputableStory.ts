//
//  reputableStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
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
  static usersSharedKey: string = "usersShared";
  static totalMomentNumberKey: string = "totalMomentNumber";
  static totalViewsKey: string = "totalViews";


  // MARK: - Public Instance Properties
  story: FoodieStory;


  // MARK: - Constructor
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
    this.set(ReputableStory.usersSharedKey, 0);
    this.set(ReputableStory.totalMomentNumberKey, 0);
    this.set(ReputableStory.totalViewsKey, 0);
  }

  // Property Accessors
  getStoryId(): string {
    let getValue = this.get(ReputableStory.storyIdKey);
    if (getValue) { return getValue; }
    else { return ""; }
  }

  getScoreMetricVer(): number {
    let getValue = this.get(ReputableStory.scoreMetricVerKey);
    if (getValue) { return getValue; }
    else { return 0; }
  }

  getUsersViewed(): number {
    let getValue = this.get(ReputableStory.usersViewedKey);
    if (getValue) { return getValue; }
    else { return 0; }
  }

  getUsersLiked(): number {
    let getValue = this.get(ReputableStory.usersLikedKey);
    if (getValue) { return getValue; }
    else { return 0; }
  }

  getUsersSwipedUp(): number {
    let getValue = this.get(ReputableStory.usersSwipedUpKey);
    if (getValue) { return getValue; }
    else { return 0; }
  }

  getUsersClickedVenue(): number {
    let getValue = this.get(ReputableStory.usersClickedVenueKey);
    if (getValue) { return getValue; }
    else { return 0; }
  }

  getUsersClickedProfile(): number {
    let getValue = this.get(ReputableStory.usersClickedProfileKey);
    if (getValue) { return getValue; }
    else { return 0; }
  }

  getUsersShared(): number {
    let getValue = this.get(ReputableStory.usersSharedKey);
    if (getValue) { return getValue; }
    else { return 0; }
  }

  getTotalMomentNumber(): number {
    let getValue = this.get(ReputableStory.totalMomentNumberKey);
    if (getValue) { return getValue; }
    else { return 0; }
  }

  getTotalViews(): number {
    let getValue = this.get(ReputableStory.totalViewsKey);
    if (getValue) { return getValue; }
    else { return 0; }
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
      case StoryActionTypeEnum.Shared:
        this.incUsersShared();
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

  incUsersShared() {
    this.increment(ReputableStory.usersSharedKey);
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

  // Score Calculation
  calculateStoryScore(): number {
    let scoringEngine = ScoreStoryMetric.scoreMetricVer[this.getScoreMetricVer()];

    debugConsole.log(SeverityEnum.Verbose, "calculating Story Score");

    if (scoringEngine) {
      return scoringEngine.calculate(this.story, this);
    } else {
      debugConsole.error("Unable to get Scoring Metric Ver: " + this.getScoreMetricVer());
      return ScoreStoryMetric.defaultScore;
    }
  }

  // Logging
  debugConsoleLog(severity: SeverityEnum) {
    debugConsole.log(severity, "ReputableStory ID: " + this.id +
                               "\n" + ReputableStory.scoreMetricVerKey + ": " + this.getScoreMetricVer() +
                               "\n" + ReputableStory.usersViewedKey + ": " + this.getUsersViewed() +
                               "\n" + ReputableStory.usersLikedKey + ": " + this.getUsersLiked() +
                               "\n" + ReputableStory.usersSwipedUpKey + ": " + this.getUsersSwipedUp() +
                               "\n" + ReputableStory.usersClickedVenueKey + ": " + this.getUsersClickedVenue() +
                               "\n" + ReputableStory.usersClickedProfileKey + ": " + this.getUsersClickedProfile() +
                               "\n" + ReputableStory.usersSharedKey + ": " + this.getUsersShared() +
                               "\n" + ReputableStory.totalMomentNumberKey + ": " + this.getTotalMomentNumber() +
                               "\n" + ReputableStory.totalViewsKey + ": " + this.getTotalViews());
  }
}

Parse.Object.registerSubclass("ReputableStory", ReputableStory);
