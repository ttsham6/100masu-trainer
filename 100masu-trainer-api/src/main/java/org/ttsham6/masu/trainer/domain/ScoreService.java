package org.ttsham6.masu.trainer.domain;

import org.springframework.stereotype.Service;

import java.util.stream.IntStream;

@Service
public class ScoreService {

    private final ScoreRepository scoreRepository;

    public ScoreService(ScoreRepository scoreRepository) {
        this.scoreRepository = scoreRepository;
    }

    public int saveScoreAndGetRank(Score myScore) {
        final var topScores = scoreRepository.getScoresAscByTime(100);

        final var myRank = topScores.isEmpty()
                ? 1
                : IntStream.range(0, topScores.size())
                .filter(i -> topScores.get(i).scoreTime() > myScore.scoreTime())
                .findFirst()
                .orElse(topScores.size() + 1);

        scoreRepository.saveScore(myScore);

        return myRank;
    }
}
