package org.ttsham6.masu.trainer.application;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.ttsham6.masu.trainer.domain.Score;
import org.ttsham6.masu.trainer.domain.ScoreService;

@RestController
public class ScoreController {

    private final ScoreService scoreService;

    public ScoreController(ScoreService scoreService) {
        this.scoreService = scoreService;
    }

    @PostMapping("/rank")
    public int saveScore(@RequestBody ScoreRequest scoreRequest) {
        return scoreService.saveScoreAndGetRank(new Score(null, scoreRequest.scoreTime()));
    }
}
