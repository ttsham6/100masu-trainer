package org.ttsham6.masu.trainer.domain;

import java.util.List;

public interface ScoreRepository {
    void saveScore(Score score);

    List<Score> getScoresAscByTime(int limit);
}
