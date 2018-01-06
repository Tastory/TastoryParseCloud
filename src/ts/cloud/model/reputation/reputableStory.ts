//
//  reputableStory.js
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

class ReputableStory extends Parse.Object {

  constructor() {
    super("ReputableStory");
  }
}

Parse.Object.registerSubclass("ReputableStory", ReputableStory);
