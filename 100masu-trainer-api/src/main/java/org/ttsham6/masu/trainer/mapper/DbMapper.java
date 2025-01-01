package org.ttsham6.masu.trainer.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.ttsham6.masu.trainer.domain.Score;

import java.util.List;

@Mapper
public interface DbMapper {
    void saveScore(Score score);

    List<Score> getScoresAscByTime(int limit);
}
