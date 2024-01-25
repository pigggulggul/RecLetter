package com.sixcube.recletter.user.dto.res;

import com.sixcube.recletter.user.dto.UserInfo;
import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SearchUserInfoRes {
    private UserInfo userInfo;

}