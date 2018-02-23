//
//  foodieUser.ts
//  TastoryParseCloud
//
//  Created by Victor Tsang on 2018-02-21
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//

class FoodieUser extends Parse.User {
	static fullNameKey: string = "fullName";
	static usernameKey: string = "username";

  constructor() {
    super("FoodieUser");
  }
}

Parse.User.registerSubclass("FoodieStory", FoodieStory);