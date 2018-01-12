//
//  beforeSaveFoodieStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

Parse.Cloud.beforeSave("FoodieStory", function(request, response) {
  let story = request.object;
  story.set(FoodieStory.discoverabilityKey, ScoreStoryMetric.initialScore);  // TODO: Initialize or Update Discoverability Score
  response.success()
});
