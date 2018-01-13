//
//  beforeSaveFoodieStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

Parse.Cloud.beforeSave("FoodieStory", function(request, response) {
  let story: FoodieStory = request.object;
  let reputation: ReputableStory = story.get(FoodieStory.reputationKey);



  if (reputation) {
    debugConsole.log(SeverityEnum.Verbose, "beforeSave for storyID " + story.id + " with Reputation");
    reputation.fetch().then(
      function(reputableStory) {
        reputableStory.story = story;  // Important!!! This handle is not auto populated by Parse. Always manuall populate on retrieve!!
        story.set(FoodieStory.discoverabilityKey, reputation.calculateStoryScore());
        response.success();
      },
      function(error) {
        debugConsole.log(SeverityEnum.Warning, "Unable to fetch ReputableStory for Story ID: " + story.id);
        story.set(FoodieStory.discoverabilityKey, ScoreStoryMetric.defaultScore);  // TODO: Initialize or Update Discoverability Score
        response.success();
      }
    );
  }

  else {
    debugConsole.log(SeverityEnum.Verbose, "beforeSave for storyID " + story.id + " without Reputation");
    story.set(FoodieStory.discoverabilityKey, ScoreStoryMetric.initialScore);  // TODO: Initialize or Update Discoverability Score
    response.success();
  }
});
