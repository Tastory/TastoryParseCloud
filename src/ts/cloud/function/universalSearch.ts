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
  let queryStory = new Parse.Query(FoodieStory)
	let queryVenue = new Parse.Query(FoodieVenue)

  queryFullName.matches("fullName", searchTerm, "i")	
  queryUserName.matches("username", searchTerm , "i")
  queryStory.matches("title", searchTerm, "i")
  queryVenue.matches("name", searchTerm, "i")
  
  let userQuery = Parse.Query.or(queryFullName, queryUserName)

  // limit to 3 results for each category
  userQuery.limit(3)
  queryStory.limit(3)
  queryVenue.limit(3)

  var searchResults:Parse.Object[] = []

  // venue 
  // 	restaurant name (foursquare)
  // 	category (foursquare)
  userQuery.find().then(
    function(results){
      debugConsole.log(SeverityEnum.Debug, "Found " + results.length + " users");
      let users: FoodieUser[] = results

      for (let user of users) {
        //var objStr = JSON.stringify(user)
        //debugConsole.log(SeverityEnum.Debug, objStr)
        searchResults.push(user)
      }

      return queryStory.find()
    }).then(
    function(results){
      debugConsole.log(SeverityEnum.Debug, "Found " + results.length + " stories");
      let stories: FoodieStory[] = results

       for (let story of stories) {
        //var objStr = JSON.stringify(story)
        //debugConsole.log(SeverityEnum.Debug, objStr)
        searchResults.push(story)
      }

      return queryVenue.find()
    }).then(
    function(results){
      debugConsole.log(SeverityEnum.Debug, "Found " + results.length + " venues");
      let venues: FoodieVenue[] = results
       for (let venue of venues) {
        searchResults.push(venue)
       }
       //searchResults.concat(venues)
      res.success(searchResults)
    }, 
    function(error){
      res.error(error)
    });
});