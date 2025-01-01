package org.ttsham6.masu.trainer.infra;

import org.springframework.stereotype.Component;
import org.ttsham6.masu.trainer.domain.Score;
import org.ttsham6.masu.trainer.domain.ScoreRepository;
import org.ttsham6.masu.trainer.mapper.DbMapper;

import java.util.List;

@Component
public class ScoreRepositoryImpl implements ScoreRepository {

    private final DbMapper dbMapper;

    public ScoreRepositoryImpl(DbMapper dbMapper) {
        this.dbMapper = dbMapper;
    }

    @Override
    public void saveScore(Score score) {
        dbMapper.saveScore(score);
    }

    @Override
    public List<Score> getScoresAscByTime(int limit) {
        return dbMapper.getScoresAscByTime(limit);
    }
}
