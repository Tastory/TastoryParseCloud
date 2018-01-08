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

  initializeRollUp(scoreMetricVer: number) {
    this.set("scoreMetricVer", scoreMetricVer);
    this.set("usersViewed", 0);
    this.set("usersLiked", 0);
    this.set("usersSwipedUp", 0);
    this.set("usersClickedVenue", 0);
    this.set("usersClickedProfile", 0);
    this.set("avgMomentNumber", 0);
    this.set("totalViews", 0);
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
    this.set(ReputableStory.usersSwipedUpKey, usersSwipedUp)
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

  calculateStoryScore() {

  }
}

Parse.Object.registerSubclass("ReputableStory", ReputableStory);
