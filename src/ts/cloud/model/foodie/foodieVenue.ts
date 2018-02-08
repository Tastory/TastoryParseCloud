//
//  foodieVenue.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//

class FoodieVenue extends Parse.Object {

  static locationKey: string = "location";

  constructor() {
    super("FoodieVenue");
  }
}

Parse.Object.registerSubclass("FoodieVenue", FoodieVenue);
