//
//  foodieStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

class FoodieStory extends Parse.Object {

  static reputationKey: string = "reputation";
  static venueKey: string = "venue";
  static authorKey: string = "author;"
  static discoverabilityKey: string = "discoverability";

  constructor() {
    super("FoodieStory");
  }
}

Parse.Object.registerSubclass("FoodieStory", FoodieStory);
