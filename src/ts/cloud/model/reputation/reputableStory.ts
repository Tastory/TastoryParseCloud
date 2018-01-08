//
//  reputableStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

class ReputableStory extends Parse.Object {

  private scoreMetricVer: number;
  private usersViewed: number;
  private usersLiked: number;
  private usersSwipedUp: number;
  private usersClickedVenue: number;
  private usersClickedProfile: number;
  private avgMomentNumber: number;
  private totalViews: number;

  constructor() {
    super("ReputableStory");
  }

  initializeRollUp(scoreMetricVer: number) {
    this.scoreMetricVer = scoreMetricVer;
    this.usersViewed = 0;
    this.usersLiked = 0;
    this.usersSwipedUp = 0;
    this.usersClickedVenue = 0;
    this.usersClickedProfile = 0;
    this.avgMomentNumber = 0;
    this.totalViews = 0;
  }

  // Explicit Claims
  incUsersLiked() { this.usersLiked++; }
  decUsersLiked() { this.usersLiked--; }

  // Implicit Claims
  incUsersSwipedUp() { this.usersSwipedUp++; }
  incUsersClickedVenue() { this.usersClickedVenue++; }
  thisUsersClickedProfile() { this.usersClickedProfile++; }

  // View Counts
  incUsersViewed() { this.usersViewed++; }
  incTotalViewed() { this.totalViews++; }
  recalAvgMomentNumber(prevMomentNumber: number, newMomentNumber: number) {
    let totalMomentNumber = this.avgMomentNumber * this.usersViewed;
    totalMomentNumber = totalMomentNumber - prevMomentNumber + newMomentNumber;
    this.avgMomentNumber = totalMomentNumber / this.usersViewed;
  }
}

Parse.Object.registerSubclass("ReputableStory", ReputableStory);
