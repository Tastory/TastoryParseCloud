//
//  scoreStoryMetric.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

class ScoreStoryMetric {

  // MARK: - Public Static Properties
  static scoreMetricVer: (ScoreStoryMetric | null)[];
  static initialScore: number = 100;  // 90 on max Newness Boost + 10 on base quality score
  static defaultScore: number = 65;  // Random middle of the road score

  // MARK: - Public Properties
  baseScore: number;
  percentageLikedWeighting: number;
  avgMomentWeighting: number;
  usersViewedWeighting: number;

  percentageSwipedWeighting: number;
  percentageClickedProfileWeighting: number;
  percentageClickedVenueWeighting: number;

  newnessFactor: number;
  newnessHalfLife: number;
  decayHalfLife: number;

  avgMomentNormalizeConstant: number;
  usersViewedNormalizeLogConstant: number;

  logCalculationSteps: boolean = false;

  // MARK: - Constructor
  constructor(baseScore: number,
              percentageLikedWeighting: number,
              avgMomentWeighting: number,
              usersViewedWeighting: number,
              percentageSwipedWeighting: number,
              percentageClickedProfileWeighting: number,
              percentageClickedVenueWeighting: number,
              newnessFactor: number,
              newnessHalfLife: number,
              decayHalfLife: number,
              avgMomentNormalizeConstant: number,
              usersViewedNormalizeLogConstant: number) {

    this.baseScore = baseScore;
    this.percentageLikedWeighting = percentageLikedWeighting;
    this.avgMomentWeighting = avgMomentWeighting;
    this.usersViewedWeighting = usersViewedWeighting;

    this.percentageSwipedWeighting = percentageSwipedWeighting;
    this.percentageClickedProfileWeighting = percentageClickedProfileWeighting;
    this.percentageClickedVenueWeighting = percentageClickedVenueWeighting;

    this.newnessFactor = newnessFactor;
    this.newnessHalfLife = newnessHalfLife;
    this.decayHalfLife = decayHalfLife;

    this.avgMomentNormalizeConstant = avgMomentNormalizeConstant;
    this.usersViewedNormalizeLogConstant = usersViewedNormalizeLogConstant;
  }


  // MARK: - Public Instance Properties
  calculate(story: FoodieStory, reputation: ReputableStory): number {

    // HACK: !! Keep Hidden Posts Hidden !!
    if (story.get(FoodieStory.discoverabilityKey) == 0) {
      return 0
    }

    const msInDay = 24 * 60 * 60 * 1000;
    let currentDate = new Date();
    let creationTime: number = story.createdAt.getTime()/msInDay;
    let currentTime: number = currentDate.getTime()/msInDay;
    let storyAge = currentTime - creationTime;  // This is in days

    debugConsole.log(SeverityEnum.Verbose, "Quality Score Calculation timestamp: " + currentDate.toUTCString() + " in Days " + currentTime + ",  creationDays: " + creationTime);

    // Let's see how much Newness Boost there is
    // Boost Score = Newness Factor x 1/(2^time)
    let newnessBoost = this.newnessFactor * 1/Math.pow(2, storyAge);
    if (this.logCalculationSteps) {
      debugConsole.log(SeverityEnum.Verbose, "Newness Boost for storyID: " + story.id + " = " + newnessBoost);
    }

    // Let's calculate the Quality Component Score!!
    // User Views logarithmic normalization
    // User View Component Score = 1 - 1/log20(time + 20), where 20 is an example normalization constant
    let usersViewed = reputation.getUsersViewed();
    let usersViewedNormalized = 1 - 1/(Math.log(usersViewed + this.usersViewedNormalizeLogConstant) / Math.log(this.usersViewedNormalizeLogConstant));
    let usersViewedWeighted = this.usersViewedWeighting * usersViewedNormalized;
    if (this.logCalculationSteps) {
      debugConsole.log(SeverityEnum.Verbose, "Users Viewed Weighted for storyID: " + story.id + " = " + usersViewedWeighted);
    }

    // Calculate the average number of Moments viewed
    let avgMomentsWeighted: number = 0;
    let percentageLikedWeighted: number = 0;
    let percentageSwipedWeighted: number = 0;
    let percentageClickedProfileWeighted: number = 0;
    let percentageClickedVenueWeighted: number = 0;

    if (usersViewed != 0) {
      let avgMomentsViewed = reputation.getTotalMomentNumber() / reputation.getUsersViewed();

      // Moment number inverse normalization
      let avgMomentsNormalized = this.normalizeAvgMoment(avgMomentsViewed);
      avgMomentsWeighted = this.avgMomentWeighting * avgMomentsNormalized;
      if (this.logCalculationSteps) {
        debugConsole.log(SeverityEnum.Verbose, "Avg Moments Weighted for storyID: " + story.id + " = " + avgMomentsWeighted);
      }

      let percentageLiked = reputation.getUsersLiked() / reputation.getUsersViewed();
      if (percentageLiked > 1.0) {
        debugConsole.error("PercentageLiked = " + percentageLiked + " exceeded 100%");
        percentageLiked = Math.max(1.0, percentageLiked);
      }
      percentageLikedWeighted = this.percentageLikedWeighting * percentageLiked;

      let percentageSwiped = reputation.getUsersSwipedUp() / reputation.getUsersViewed();
      if (percentageSwiped > 1.0) {
        debugConsole.error("PercentageSwiped = " + percentageSwiped + " exceeded 100%");
        percentageSwiped = Math.max(1.0, percentageSwiped);
      }
      percentageSwipedWeighted = this.percentageSwipedWeighting * percentageSwiped;

      let percentageClickedProfile = reputation.getUsersClickedProfile() / reputation.getUsersViewed();
      if (percentageClickedProfile > 1.0) {
        debugConsole.error("PercentageClickedProfile = " + percentageClickedProfile + " exceeded 100%");
        percentageClickedProfile = Math.max(1.0, percentageClickedProfile);
      }
      percentageClickedProfileWeighted = this.percentageClickedProfileWeighting * percentageClickedProfile;

      let percentageClickedVenue = reputation.getUsersClickedVenue() / reputation.getUsersViewed();
      if (percentageClickedVenue > 1.0) {
        debugConsole.error("PercentageClickedVenue = " + percentageClickedVenue + " exceeded 100%");
        percentageClickedVenue = Math.max(1.0, percentageClickedVenue);
      }
      percentageClickedVenueWeighted = this.percentageClickedVenueWeighting * percentageClickedVenue;
    }

    // Finally the Quality Component Score!!
    let qualityComponent = this.baseScore +
                           percentageLikedWeighted +
                           percentageSwipedWeighted +
                           percentageClickedProfileWeighted +
                           percentageClickedVenueWeighted +
                           usersViewedWeighted +
                           avgMomentsWeighted;

    if (this.logCalculationSteps) {
      debugConsole.log(SeverityEnum.Verbose, "Quality Component for storyID: " + story.id + " = " + qualityComponent);
    }

    // Apply Quality Decay Half Life
    let decayedQuality = qualityComponent * 1/Math.pow(2, storyAge/this.decayHalfLife);
    if (this.logCalculationSteps) {
      debugConsole.log(SeverityEnum.Verbose, "Decayed Quality for storyID: " + story.id + " = " + decayedQuality);
    }

    let totalScore = newnessBoost + decayedQuality
    debugConsole.log(SeverityEnum.Verbose, "Total Quality Score for storyID: " + story.id + " = " + totalScore);
    return totalScore;
  }

  normalizeUsersViewed(usersViewed: number): number {
    return 1 - 1/(Math.log(usersViewed + this.usersViewedNormalizeLogConstant) / Math.log(this.usersViewedNormalizeLogConstant));
  }

  normalizeAvgMoment(avgMoment: number): number {
    return 1 - 1/(this.avgMomentNormalizeConstant * avgMoment + 1)
  }
}


// MARK: - Defining Scoring Metric Versions
ScoreStoryMetric.scoreMetricVer = [
  null,  // Placeholder so version number lines up with array index

  // Story Scoring Metric ver. 1
  new ScoreStoryMetric(10, // baseScore: number;
                       40, // percentageLikedWeighting: number;
                       30, // avgMomentWeighting: number;
                       30, // usersViewedWeighting: number;

                       20, // percentageSwipedWeighting: number;
                       10, // percentageClickedProfileWeighting: number;
                       10, // percentageClickedVenueWeighting: number;

                       90, // newnessFactor: number;
                       1.0, // newnessHalfLife: number; (in days)
                       120, // decayHalfLife: number; (in days)

                       0.3, // avgMomentNormalizeConstant: number;
                       20) // usersViewedNormalizeLogConstant: number;
]
