package com.sixcube.recletter.studio.repository;

import com.sixcube.recletter.studio.dto.Studio;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudioRepository extends JpaRepository<Studio, String> {

  List<Studio> findByStudioIdIn(List<String> studoIdList);

}