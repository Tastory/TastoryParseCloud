//
//  foodieStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

class FoodieStory extends Parse.Object {

  constructor() {
    super("FoodieStory");
  }
}

Parse.Object.registerSubclass("FoodieStory", FoodieStory);