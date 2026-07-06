package com.antiadhd.ai;

import com.antiadhd.ai.dto.AiSuggestionResponse;
import com.antiadhd.user.AppUser;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AiSuggestionService {
    public AiSuggestionResponse getSuggestions(AppUser user) {
        return new AiSuggestionResponse(
                "placeholder",
                false,
                List.of(
                        "오늘 일정 중 가장 중요한 블록 1개를 먼저 완료하세요.",
                        "집중 모드는 25분 단위로 시작하고, 완료 후 Daily Review에 기록하세요.",
                        "AI 추천은 추후 외부 모델 연동 지점에서 확장됩니다."
                )
        );
    }
}

