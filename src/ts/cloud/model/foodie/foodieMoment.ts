//
//  foodieMoment.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-02-07
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.
//

class FoodieMoment extends Parse.Object {

  constructor() {
    super("FoodieMoment");
  }
}

Parse.Object.registerSubclass("FoodieMoment", FoodieMoment);
