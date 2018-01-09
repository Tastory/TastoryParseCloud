//
//  reputableStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

class ReputableStory extends Parse.Object {

  private static storyIdKey: string = "storyId";
  private static scoreMetricVerKey: string = "scoreMetricVer";
  private static usersViewedKey: string = "usersViewed";
  private static usersLikedKey: string = "usersLiked";
  private static usersSwipedUpKey: string = "usersSwipedUp";
  private static usersClickedVenueKey: string = "usersClickedVenue";
  private static usersClickedProfileKey: string = "usersClickedProfile";
  private static avgMomentNumberKey: string = "avgMomentNumber";
  private static totalViewsKey: string = "totalViews";

  private story: FoodieStory;


  constructor() {
    super("ReputableStory");
  }


  static getStoryWithLog(storyId: string): Parse.Promise<ReputableStory> {
    debugConsole.log(SeverityEnum.Verbose, "reputableStory.ts getStoryWithLog() " + storyId + " executed");

    let promise = new Parse.Promise<ReputableStory>();
    let reputableStory: ReputableStory;
    let foodieStory: FoodieStory;

    let query = new Parse.Query(FoodieStory);
    query.include(FoodieStory.reputationKey);
    query.get(storyId).then(function(story) {

      if (!story.get(FoodieStory.reputationKey)) {
        reputableStory = new ReputableStory();
        reputableStory.initializeReputation(story, reputationScoreStoryMetricVer);
      } else {
        reputableStory = story.get(FoodieStory.reputationKey);
        reputableStory.debugConsoleLog(SeverityEnum.Verbose);
      }

      reputableStory.story = story;
      return reputableStory.save(null, masterKeyOption);

    }).then(
      function(reputation) {
        promise.resolve(reputation);
      },

      function(error) {
        promise.reject(error);
      }
    );

    return promise;
  }


  static incUsersLikedFor(storyId: string, callback: AnyErrorMsgFunction) {
    debugConsole.log(SeverityEnum.Verbose, "reputableStory.ts incUsersLikedFor() " + storyId + " executed");

    ReputableStory.getStoryWithLog(storyId).then(function(reputation) {
      reputation.incUsersLiked();
      return reputation.save(null, masterKeyOption);

    }).then(function(reputation) {
      let story = reputation.story;
      if (!story) {
        debugConsole.log(SeverityEnum.Warning, "ReputableStory does not point to a Story!!!")
      } else {
        story.set(FoodieStory.discoverabilityKey, reputation.calculateStoryScore());
      }
      story.set(FoodieStory.reputationKey, reputation);
      return story.save(null, masterKeyOption);

    }).then(
      function(reputableStory) {
        debugConsole.log(SeverityEnum.Verbose, "Parse Like for Story ID: " + storyId + " success")
        callback(reputableStory, "Parse Like for Story ID: " + storyId + " success");
      },

      function(error) {
        debugConsole.log(SeverityEnum.Verbose, "Parse Like for Story ID: " + storyId + "failed - " + error.code + " " + error.message);
        callback(null, "Parse Like for Story ID: " + storyId + "failed - " + error.code + " " + error.message);
      }
    );
  }


  static decUsersLikedFor(storyId: string, callback: AnyErrorMsgFunction) {
    debugConsole.log(SeverityEnum.Verbose, "reputableStory.ts incUsersLikedFor() " + storyId + " executed");

    ReputableStory.getStoryWithLog(storyId).then(function(reputation) {
      reputation.decUsersLiked();
      return reputation.save(null, masterKeyOption);

    }).then(function(reputation) {
      let story = reputation.story;
      if (!story) {
        debugConsole.log(SeverityEnum.Warning, "ReputableStory does not point to a Story!!!")
      } else {
        story.set(FoodieStory.discoverabilityKey, reputation.calculateStoryScore());
      }
      story.set(FoodieStory.reputationKey, reputation);
      return story.save(null, masterKeyOption);

    }).then(
      function(reputableStory) {
        debugConsole.log(SeverityEnum.Verbose, "Parse Like for Story ID: " + storyId + " success")
        callback(reputableStory, "Parse Like for Story ID: " + storyId + " success");
      },

      function(error) {
        debugConsole.log(SeverityEnum.Verbose, "Parse Like for Story ID: " + storyId + "failed - " + error.code + " " + error.message);
        callback(null, "Parse Like for Story ID: " + storyId + "failed - " + error.code + " " + error.message);
      }
    );
  }


  private initializeReputation(story: FoodieStory, scoreMetricVer: number) {
    debugConsole.log(SeverityEnum.Verbose, "reputableStory.ts initializeReputation() for Story ID: " + story.id + " executed");
    this.set(ReputableStory.storyIdKey, story.id);
    this.set(ReputableStory.scoreMetricVerKey, scoreMetricVer);
    this.set(ReputableStory.usersViewedKey, 0);
    this.set(ReputableStory.usersLikedKey, 0);
    this.set(ReputableStory.usersSwipedUpKey, 0);
    this.set(ReputableStory.usersClickedVenueKey, 0);
    this.set(ReputableStory.usersClickedProfileKey, 0);
    this.set(ReputableStory.avgMomentNumberKey, 0);
    this.set(ReputableStory.totalViewsKey, 0);
  }


  private debugConsoleLog(severity: SeverityEnum) {
    debugConsole.log(severity, "ReputableStory ID: " + this.id +
                               "\n" + ReputableStory.scoreMetricVerKey + ": " + this.get(ReputableStory.scoreMetricVerKey) +
                               "\n" + ReputableStory.usersViewedKey + ": " + this.get(ReputableStory.usersViewedKey) +
                               "\n" + ReputableStory.usersLikedKey + ": " + this.get(ReputableStory.usersLikedKey) +
                               "\n" + ReputableStory.usersSwipedUpKey + ": " + this.get(ReputableStory.usersSwipedUpKey) +
                               "\n" + ReputableStory.usersClickedVenueKey + ": " + this.get(ReputableStory.usersClickedVenueKey) +
                               "\n" + ReputableStory.usersClickedProfileKey + ": " + this.get(ReputableStory.usersClickedProfileKey) +
                               "\n" + ReputableStory.avgMomentNumberKey + ": " + this.get(ReputableStory.avgMomentNumberKey) +
                               "\n" + ReputableStory.totalViewsKey + ": " + this.get(ReputableStory.totalViewsKey));
  }


  // Explicit Claims
  incUsersLiked() {
    let usersLiked = this.get(ReputableStory.usersLikedKey) + 1;
    this.set(ReputableStory.usersLikedKey, usersLiked);
  }

  decUsersLiked() {
    let usersLiked = this.get(ReputableStory.usersLikedKey) - 1;
    this.set(ReputableStory.usersLikedKey, usersLiked);
  }

  // Implicit Claims
  incUsersSwipedUp() {
    let usersSwipedUp = this.get(ReputableStory.usersSwipedUpKey) + 1;
    this.set(ReputableStory.usersSwipedUpKey, usersSwipedUp);
  }

  incUsersClickedVenue() {
    let usersClickedVenue = this.get(ReputableStory.usersClickedVenueKey) + 1;
    this.set(ReputableStory.usersClickedVenueKey, usersClickedVenue);
  }

  thisUsersClickedProfile() {
    let usersClickedProfile = this.get(ReputableStory.usersClickedProfileKey) +1;
    this.set(ReputableStory.usersClickedProfileKey, usersClickedProfile);
  }

  // View Counts
  incUsersViewed() {
    let usersViewed = this.get(ReputableStory.usersViewedKey) + 1;
    this.set(ReputableStory.usersViewedKey, usersViewed);
  }

  incTotalViewed() {
    let totalViews =  this.get(ReputableStory.totalViewsKey) + 1;
    this.set(ReputableStory.totalViewsKey, totalViews);
  }

  recalAvgMomentNumber(prevMomentNumber: number, newMomentNumber: number) {
    let avgMomentNumber = this.get(ReputableStory.avgMomentNumberKey);
    let usersViewed = this.get(ReputableStory.usersViewedKey);
    let totalMomentNumber = avgMomentNumber * usersViewed;

    totalMomentNumber = totalMomentNumber - prevMomentNumber + newMomentNumber;
    avgMomentNumber = totalMomentNumber / usersViewed;
    this.set(ReputableStory.avgMomentNumberKey, avgMomentNumber);
  }

  calculateStoryScore(): number {
    return 100;
  }
}

Parse.Object.registerSubclass("ReputableStory", ReputableStory);
