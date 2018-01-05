//
//  reputableClaim.js
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

"use strict"

class ReputableClaim extends Parse.Object {

  constructor() {
    super("ReputableClaim");
  }
}

Parse.Object.registerSubclass("ReputableClaim", ReputableClaim);
