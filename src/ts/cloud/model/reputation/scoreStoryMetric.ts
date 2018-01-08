//
//  scoreStoryMetric.ts
//  TastoryParseCloud
//
//  Created by Howard Lee on 2018-01-04
//  Copyright © 2018 Tastry. All rights reserved.
//

class ScoreStoryMetric {

  static scoreMetricVer: ScoreStoryMetric[];

  baseScore: number;
  percentageLikeWeighting: number;
  avgMomentWeighting: number;
  usersViewedWeighting: number;

  percentageSwipedWeighting: number;
  percentageProfileClickedWeighting: number;
  percetnageVenueClickedWeighting: number;

  newnessFactor: number;
  newnessHalfLife: number;
  decayHalfLife: number;

  avgMomentInverseConstant: number;
  usersViewedLogConstant: number;

  constructor(baseScore: number,
              percentageLikeWeighting: number,
              avgMomentWeighting: number,
              usersViewedWeighting: number,
              percentageSwipedWeighting: number,
              percentageProfileClickedWeighting: number,
              percetnageVenueClickedWeighting: number,
              newnessFactor: number,
              newnessHalfLife: number,
              decayHalfLife: number,
              avgMomentInverseConstant: number,
              usersViewedLogConstant: number) {

    this.baseScore = baseScore;
    this.percentageLikeWeighting = percentageLikeWeighting;
    this.avgMomentWeighting = avgMomentWeighting;
    this.usersViewedWeighting = usersViewedWeighting;

    this.percentageSwipedWeighting = percentageSwipedWeighting;
    this.percentageProfileClickedWeighting = percentageProfileClickedWeighting;
    this.percetnageVenueClickedWeighting = percetnageVenueClickedWeighting;

    this.newnessFactor = newnessFactor;
    this.newnessHalfLife = newnessHalfLife;
    this.decayHalfLife = decayHalfLife;

    this.avgMomentInverseConstant = avgMomentInverseConstant;
    this.usersViewedLogConstant = usersViewedLogConstant;
  }
}

ScoreStoryMetric.scoreMetricVer = [

  // Story Scoring Metric ver. 1
  new ScoreStoryMetric(10, // baseScore: number;
                       40, // percentageLikeWeighting: number;
                       30, // avgMomentWeighting: number;
                       30, // usersViewedWeighting: number;

                       20, // percentageSwipedWeighting: number;
                       10, // percentageProfileClickedWeighting: number;
                       10, // percetnageVenueClickedWeighting: number;

                       0.9, // newnessFactor: number;
                       1.0, // newnessHalfLife: number; (in days)
                       120, // decayHalfLife: number; (in days)

                       0.3, // avgMomentInverseConstant: number;
                       20) // usersViewedLogConstant: number;

  // More Story Scoring Metrics...
]
