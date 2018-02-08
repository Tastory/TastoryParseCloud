//
//  foodieStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//

class FoodieStory extends Parse.Object {

  static titleKey: string = "title";
  static momentsKey: string = "moments";
  static venueKey: string = "venue";
  static discoverableKey: string = "discoverable";
  static discoverabilityKey: string = "discoverability";
  static reputationKey: string = "reputation";

  constructor() {
    super("FoodieStory");
  }
}

Parse.Object.registerSubclass("FoodieStory", FoodieStory);
