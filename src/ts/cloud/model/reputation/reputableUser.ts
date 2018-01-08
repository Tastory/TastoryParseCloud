//
//  reputableUser.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

class ReputableUser extends Parse.Object {

  constructor() {
    super("ReputableUser");
  }
}

Parse.Object.registerSubclass("ReputableUser", ReputableUser);
