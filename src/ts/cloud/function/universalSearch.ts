//
//  universalSearch.ts
//  TastoryParseCloud
//
//  Created by Victor Tsang on 2018-02-21
//  Copyright © 2018 Tastory Lab Inc. All rights reserved.


Parse.Cloud.define("universalSearch", function(req, res) {
  debugConsole.log(SeverityEnum.Debug, "universalSearch.ts ParseCloudFunction 'universalSearch' triggered");

  let searchTerm = req.params.keywords
  debugConsole.log(SeverityEnum.Debug , "looking up: " + searchTerm)

  let queryFullName = new Parse.Query(FoodieUser)
  let queryUserName = new Parse.Query(FoodieUser)
  let queryTitle = new Parse.Query(FoodieStory)
	 
  queryFullName.matches("fullName", searchTerm, "i")	
  queryUserName.matches("username", searchTerm , "i")
  queryTitle.matches("title", searchTerm, "i")
  
  let userQuery = Parse.Query.or(queryFullName, queryUserName)

  // limit to 3 results for each category
  userQuery.limit(3)
  queryTitle.limit(3)

  var searchResults:Parse.Object[] = []

  // venue 
  // 	restaurant name (foursquare)
  // 	category (foursquare)
  userQuery.find().then(
    function(results){
      debugConsole.log(SeverityEnum.Debug, "Found " + results.length + " users");
      let users: FoodieUser[] = results

      for (let user of users) {
        var objStr = JSON.stringify(user)
        debugConsole.log(SeverityEnum.Debug, objStr)
        searchResults.push(user)
      }

      return queryTitle.find()
    }).then(
    function(results){
      debugConsole.log(SeverityEnum.Debug, "Found " + results.length + " stories");
      let stories: FoodieStory[] = results

       for (let story of stories) {
        var objStr = JSON.stringify(story)
        debugConsole.log(SeverityEnum.Debug, objStr)
        searchResults.push(story)
      }
      res.success(searchResults)
    }, 
    function(error){
      res.error(error)
    });
});