//
//  reputableStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

class ReputableStory extends Parse.Object {

  private static scoreMetricVerKey: string = "scoreMetricVer";
  private static usersViewedKey: string = "usersViewed";
  private static usersLikedKey: string = "usersLiked";
  private static usersSwipedUpKey: string = "usersSwipedUp";
  private static usersClickedVenueKey: string = "usersClickedVenue";
  private static usersClickedProfileKey: string = "usersClickedProfile";
  private static avgMomentNumberKey: string = "avgMomentNumber";
  private static totalViewsKey: string = "totalViews";


  constructor() {
    super("ReputableStory");
  }


  static getStoryWithLog(storyId: string): Parse.Promise<ReputableStory> {
    debugConsole.log(SeverityEnum.Verbose, "reputableStory.ts getStoryWithLog() " + storyId + " executed");

    let promise = new Parse.Promise<ReputableStory>();
    let query = new Parse.Query(ReputableStory);
    query.equalTo("storyId", storyId);
    query.find().then(

      function(results) {
        let reputableStory: ReputableStory

        if (!results || results.length === 0) {
          reputableStory = new ReputableStory();
          reputableStory.initializeRollUp(reputationScoreStoryMetricVer);
          debugConsole.log(SeverityEnum.Debug, "New Reputation created for storyId " + storyId);

        } else {
          let result = results[0];

          if (results.length > 1) {
            debugConsole.log(SeverityEnum.Warning, results.length + " reputations for storyId " + storyId + " found");
          }
          result.debugConsoleLog(SeverityEnum.Verbose);
          reputableStory = result;
        }
        promise.resolve(reputableStory);
      },

      function(error) {
        promise.reject(error);
      }
    );

    return promise;
  }


  static incUsersLikedFor(storyId: string, callback: AnyErrorMsgFunction) {
    debugConsole.log(SeverityEnum.Verbose, "reputableStory.ts incUsersLikedFor() " + storyId + " executed");
    let masterKeyOption: Parse.UseMasterKeyOption = { useMasterKey: true };
    let reputableStory: ReputableStory;
    let discoverabilityScore: number;

    ReputableStory.getStoryWithLog(storyId).then(function(result) {
      result.incUsersLiked();
      return result.save(null, masterKeyOption);

    }).then(function(result) {
      reputableStory = result;
      discoverabilityScore = result.calculateStoryScore();
      let query = new Parse.Query(FoodieStory);
      return query.get(storyId);

    }).then(function(foodieStory) {
      foodieStory.set("discoverability", discoverabilityScore);
      return foodieStory.save(null, masterKeyOption);

    }).then(
      
      function(foodieStory) {
        debugConsole.log(SeverityEnum.Verbose, "Parse Like for Story ID: " + storyId + "success")
        callback(reputableStory, "Parse Like for Story ID: " + storyId + "success");
      },

      function(error) {
        debugConsole.log(SeverityEnum.Verbose, "Parse Like for Story ID: " + storyId + "failed - " + error.code + " " + error.message);
        callback(null, "Parse Like for Story ID: " + storyId + "failed - " + error.code + " " + error.message);
      }
    );
  }


  private debugConsoleLog(severity: SeverityEnum) {
    debugConsole.log(severity, "ReputableStory ID: " + this.get("objectId") +
                               "\n" + ReputableStory.scoreMetricVerKey + ": " + this.get(ReputableStory.scoreMetricVerKey) +
                               "\n" + ReputableStory.usersViewedKey + ": " + this.get(ReputableStory.usersViewedKey) +
                               "\n" + ReputableStory.usersLikedKey + ": " + this.get(ReputableStory.usersLikedKey) +
                               "\n" + ReputableStory.usersSwipedUpKey + ": " + this.get(ReputableStory.usersSwipedUpKey) +
                               "\n" + ReputableStory.usersClickedVenueKey + ": " + this.get(ReputableStory.usersClickedVenueKey) +
                               "\n" + ReputableStory.usersClickedProfileKey + ": " + this.get(ReputableStory.usersClickedProfileKey) +
                               "\n" + ReputableStory.avgMomentNumberKey + ": " + this.get(ReputableStory.avgMomentNumberKey) +
                               "\n" + ReputableStory.totalViewsKey + ": " + this.get(ReputableStory.totalViewsKey));
  }

  initializeRollUp(scoreMetricVer: number) {
    this.set(ReputableStory.scoreMetricVerKey, scoreMetricVer);
    this.set(ReputableStory.usersViewedKey, 0);
    this.set(ReputableStory.usersLikedKey, 0);
    this.set(ReputableStory.usersSwipedUpKey, 0);
    this.set(ReputableStory.usersClickedVenueKey, 0);
    this.set(ReputableStory.usersClickedProfileKey, 0);
    this.set(ReputableStory.avgMomentNumberKey, 0);
    this.set(ReputableStory.totalViewsKey, 0);
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
    return 0;
  }
}

Parse.Object.registerSubclass("ReputableStory", ReputableStory);
