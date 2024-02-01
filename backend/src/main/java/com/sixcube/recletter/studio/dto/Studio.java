package com.sixcube.recletter.studio.dto;

import com.sixcube.recletter.template.dto.BGM;
import com.sixcube.recletter.template.dto.Font;
import com.sixcube.recletter.template.dto.Frame;
import com.sixcube.recletter.user.dto.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.DynamicInsert;

@Entity
@ToString
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@DynamicInsert
public class Studio implements Serializable {

  @Id
  @Column(name = "studio_id")
  @Builder.Default
  private String studioId = UUID.randomUUID().toString();

  private String studioOwner;

  private String studioTitle;

  private LocalDateTime expireDate;

  private Integer studioFrameId;

  private Integer studioFontId;

  private Integer studioFontSize;

  private Boolean studioFontBold;

  private Integer studioBgmId;

  private Integer studioVolume;

  private Boolean isCompleted;

}
