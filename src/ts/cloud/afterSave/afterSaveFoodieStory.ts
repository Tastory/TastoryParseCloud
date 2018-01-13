//
//  afterSaveFoodieStory.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

Parse.Cloud.afterSave("FoodieStory", function(request) {
  let reputableStory: ReputableStory;
  let story = request.object;

  debugConsole.log(SeverityEnum.Verbose, "afterSave for storyID " + story.id);

  // We'll just check the existance of a reputableStory object. But dont't access it! It's not yet fetched!
  if (!story.get(FoodieStory.reputationKey)) {
    reputableStory = new ReputableStory();
    reputableStory.initializeReputation(story, reputationScoreStoryMetricVer);

    reputableStory.save(null, masterKeyOption).then(function(reputation) {
      story.set(FoodieStory.reputationKey, reputation);
      return story.save(null, masterKeyOption);

    }).then(
      function(story) {
        debugConsole.log(SeverityEnum.Debug, "New Reputation ID: " + reputableStory.id + " created for Story ID: " + story.id);
      },
      function(error) {
        debugConsole.log(SeverityEnum.Warning, "Failed to create Reputation for Story ID: " + story.id);
      }
    );
  }
});
