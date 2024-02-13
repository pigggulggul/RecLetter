import VideoCard from '../components/VideoCard';
import { useState, useEffect, BaseSyntheticEvent, useRef } from 'react';
import { StudioDetail, ClipInfo, UserInfo } from '../types/type';
import { useNavigate, Link } from 'react-router-dom';
import DeleteCheckWindow from '../components/DeleteCheckWindow';
import { connect, disconnect, unSubscribe } from '../util/chat';
import { useDispatch, useSelector } from 'react-redux';
import {
    studioAddState,
    studioDeleteState,
    studioNameState,
    studioState,
} from '../util/counter-slice';
import { enterStudio, modifyStudioTitle, studioDetail } from '../api/studio';
import { getUser } from '../api/user';
import { deleteClip } from '../api/clip';
import { httpStatusCode } from '../util/http-status';
import { getlastPath } from '../util/get-func';
import ChattingBox from '../components/ChattingBox';
import { encodingLetter } from '../api/letter.ts';

export default function StudioMainPage() {
    //영상 편집 여부
    const [isEditingName, setIsEditingName] = useState<boolean>(false);

    //영상 삭제 여부
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [deleteStateId, setDeleteStateId] = useState<number>(-1);

    //영상 정보 불러오기
    // const [clipInfoList, setClipInfoList] = useState<ClipInfo[]>([]);
    const [studioDetailInfo, setStudioDetailInfo] = useState<StudioDetail>({
        studioId: '',
        studioTitle: '',
        studioStatus: '',
        studioOwner: '',
        clipInfoList: [],
        studioFrameId: -1,
        studioBGMId: -1,
        studioStickerUrl: '',
        studioBGMVolume: 100,
    });

    //유저 정보
    const [userInfo, setUserInfo] = useState<UserInfo>({
        userId: '',
        userNickname: '',
        userEmail: '',
    });

    //현재 선택한 비디오(비디오 미리보기)
    const [selectedVideo, setSelectedVideo] = useState<ClipInfo>({
        clipId: -1,
        clipTitle: '',
        clipOwner: '',
        clipLength: -1,
        clipThumbnail: '',
        clipUrl: '',
        clipOrder: -1,
        clipVolume: -1,
        clipContent: '',
    });

    //프레임 설정
    // 선택한 프레임
    const [selectImgUrl, setSelectImgUrl] = useState<string>('');
    // 이미지 유효성 검사
    const regex =
        /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(:[0-9]+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;

    //비디오 재생중인가
    const [playingVideo, setPlayingVideo] = useState<boolean>(false);

    /** 리덕스 설정 */
    const isLogin = useSelector((state: any) => state.loginFlag.isLogin);
    const chatStudioList: string[] = useSelector(
        (state: any) => state.loginFlag.studioId
    );
    const dispatch = useDispatch();
    const navigator = useNavigate();

    //사용한 비디오, 사용하지 않은 비디오
    const [usedVideoList, setUsedVideoList] = useState<ClipInfo[]>([]);
    const [unUsedVideoList, setUnUsedVideoList] = useState<ClipInfo[]>([]);

    //영상 서버로부터 불러오기
    useEffect(() => {
        const token = localStorage.getItem('access-token');
        if (isLogin) {
            //API 불러오는 함수로 clipInfo를 받아옴
            //우선 url query String으로부터 스튜디오 상세 정보 받아오기

            const studioId = getlastPath();
            if (studioId !== '') {
                const getDetail = async (studioId: string) => {
                    await studioDetail(studioId).then((res) => {
                        if (res.status === httpStatusCode.OK) {
                            // 채팅방 불러오기 설정
                            if (chatStudioList.length === 0) {
                                dispatch(studioAddState(studioId));
                            } else {
                                let chatListFlag = false;
                                chatStudioList.map(
                                    (item: string, index: number) => {
                                        if (!chatListFlag) {
                                            if (item === studioId)
                                                chatListFlag = true;
                                        }
                                    }
                                );
                                if (!chatListFlag) {
                                    dispatch(studioAddState(studioId));
                                }
                            }
                            // 채팅방 불러오기 설정

                            dispatch(studioNameState(res.data.studioTitle));
                            setStudioDetailInfo(res.data);
                            //프레임
                            setSelectImgUrl(
                                `/src/assets/frames/frame${res.data.studioFrameId}.png`
                            );

                            //순서 불러오기
                            //우선 정렬을 한 후, 사용한 비디오, 아닌 비디오로 분리
                            const clipList = res.data.clipInfoList.sort(
                                (clipA: ClipInfo, clipB: ClipInfo) =>
                                    clipA.clipOrder - clipB.clipOrder
                            );

                            const usedVidArr: ClipInfo[] = [];
                            const unUsedVidArr: ClipInfo[] = [];

                            clipList.map((clip: ClipInfo) => {
                                if (clip.clipOrder === -1) {
                                    unUsedVidArr.push(clip);
                                } else {
                                    usedVidArr.push(clip);
                                }
                            });

                            //set
                            setUnUsedVideoList(unUsedVidArr);
                            setUsedVideoList(usedVidArr);
                            //사용한 첫 영상 자동재생
                            if (usedVidArr.length > 0) {
                                //selectVideo함수를 사용하기에는 부적합
                                //왜냐하면 아직 studioDetailInfo가 업데이트 되지 않았기 때문
                                //그래서 직접 조작 필요
                                if (videoRef.current) {
                                    setSelectedVideo(usedVidArr[0]);
                                    setPlayingVideo(true);
                                }
                            }
                        }
                    });
                    return;
                };

                const enterStudioAPI = async (studioId: string) => {
                    await enterStudio(studioId)
                        .then((res) => {
                            console.log(res);
                            getDetail(studioId);
                        })
                        .catch(() => {
                            console.log('오류떠서 재실행');
                            getDetail(studioId);
                        });
                };
                enterStudioAPI(studioId);
            }

            //유저정보 불러오기
            const getUserInfo = async () => {
                const resuser = await getUser();
                const tempObj = { ...resuser.data };
                // console.log(tempObj);
                setUserInfo({
                    userId: tempObj.userId,
                    userNickname: tempObj.userNickname,
                    userEmail: tempObj.userEmail,
                });
            };
            getUserInfo();
        }
        if (!token) {
            navigator(`/login`);
        }

        /** 페이지 새로고침 전에 실행 할 함수 */
        const reloadingStudioId = getlastPath();
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            const studioId = getlastPath();
            disconnect(studioId);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            // console.log('사라지기전 ' + reloadingStudioId + '입니다');
            dispatch(studioDeleteState(reloadingStudioId));
            disconnect(reloadingStudioId);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    //편집창으로 이동
    const onClickEdit = (clipId: number) => {
        navigator(`/clipedit?id=${clipId}`);
    };

    //요소 삭제
    const onDelete = (clipId: number) => {
        setIsDeleting(true);
        setDeleteStateId(clipId);
    };

    /** chooseDelete()
     * 삭제창에서 삭제를 선택한 경우
     * 삭제를 하도록 한다.
     */
    const chooseDelete = () => {
        if (
            studioDetailInfo !== null &&
            studioDetailInfo.clipInfoList !== undefined
        ) {
            if (selectedVideo.clipId === deleteStateId) {
                setSelectedVideo({
                    clipId: -1,
                    clipTitle: '',
                    clipOwner: '',
                    clipLength: -1,
                    clipThumbnail: '',
                    clipUrl: '',
                    clipOrder: -1,
                    clipVolume: -1,
                    clipContent: '',
                });
            }

            setStudioDetailInfo((prevValue) => {
                const prevList: ClipInfo[] = prevValue?.clipInfoList;
                //탐색 시작
                for (let i = 0; i < prevList.length; i++) {
                    if (prevList[i].clipId === deleteStateId) {
                        //발견하면, axios 삭제 요청 보낸 후 삭제
                        deleteClip(prevList[i].clipId)
                            .then((res) => {
                                if (res.status === httpStatusCode.OK) {
                                    console.log('삭제 완료');
                                } else {
                                    console.log('오류');
                                }
                            })
                            .catch((err) => {
                                console.log(err);
                            });
                        prevList.splice(i, 1);
                        break;
                    }
                }
                const newList: ClipInfo[] = [...prevList];
                const newValue = { ...prevValue };
                newValue.clipInfoList = newList;

                //자른 후 정렬, 사용/미사용 나누기
                //우선 정렬을 한 후, 사용한 비디오, 아닌 비디오로 분리
                const clipList = newList.sort(
                    (clipA: ClipInfo, clipB: ClipInfo) =>
                        clipA.clipOrder - clipB.clipOrder
                );

                const usedVidArr: ClipInfo[] = [];
                const unUsedVidArr: ClipInfo[] = [];

                clipList.map((clip: ClipInfo) => {
                    if (clip.clipOrder === -1) {
                        unUsedVidArr.push(clip);
                    } else {
                        usedVidArr.push(clip);
                    }
                });

                //set
                setUnUsedVideoList(unUsedVidArr);
                setUsedVideoList(usedVidArr);
                //사용한 첫 영상 자동재생
                if (usedVidArr.length > 0) {
                    //selectVideo함수를 사용하기에는 부적합
                    //왜냐하면 아직 studioDetailInfo가 업데이트 되지 않았기 때문
                    //그래서 직접 조작 필요
                    if (videoRef.current) {
                        setSelectedVideo(usedVidArr[0]);
                        setPlayingVideo(true);
                    }
                }

                return newValue;
            });
        }

        setDeleteStateId(-1);
        setIsDeleting(false);
    };

    /** chooseNotDelete()
     * 삭제 확인 창에서 취소를 선택할 경우
     * 삭제창을 닫기만 한다.
     */
    const chooseNotDelete = () => {
        setDeleteStateId(-1);
        setIsDeleting(false);
    };

    /**selectVideo(clipId : number)
     * 비디오 카드를 눌렀을 때, 해당 비디오가 미리보기로 보여지도록 합니다.
     * @param clipId
     * @returns
     */
    const selectVideo = (clipId: number) => {
        for (let i = 0; i < studioDetailInfo.clipInfoList.length; i++) {
            if (studioDetailInfo.clipInfoList[i].clipId === clipId) {
                setSelectedVideo(studioDetailInfo.clipInfoList[i]);
                playVideo();
                return;
            }
        }
    };

    /////////////////////////////////////////////////////////////비디오 플레이어/////////////////////////////////////////////////
    const videoRef = useRef<HTMLVideoElement>(null);

    /** playVideo()
     *  비디오를 재생한다.
     */
    const playVideo = () => {
        if (selectedVideo.clipId !== -1) {
            setPlayingVideo(true);
            if (videoRef.current) {
                videoRef.current.play();
            }
        }
    };

    /** stopVideo()
     *  비디오를 멈춘다.
     */
    const stopVideo = () => {
        setPlayingVideo(false);
        if (videoRef.current) {
            videoRef.current.pause();
        }

        //만약 전체 영상 재생 중이었다면?
        if (playAllSelectedVideoRef.current) {
            playingIdxRef.current += 1;
            //범위 내에 있는 비디오면?
            if (playingIdxRef.current < usedVideoList.length) {
                selectVideo(usedVideoList[playingIdxRef.current].clipId);
            } else {
                //다 봤으면 재생 종료
                playAllSelectedVideoRef.current = false;
                playingIdxRef.current = 0;
            }
        }
    };

    /** formatTime(time: number)
     * 초를 입력하면 0:00 형식으로 변환한다.
     * @param time
     * @returns
     */
    const formatTime = (time: number) => {
        const min = Math.floor(time / 60);
        const sec =
            Math.floor(time % 60) < 10
                ? '0' + Math.floor(time % 60)
                : '' + Math.floor(time % 60);
        return `${min}:${sec}`;
    };

    const [videoNowPosition, setVideoNowPosition] = useState<number>(0);
    const [wholeDuration, setWholeDuration] = useState<number>(0);

    //스튜디오 이름 변경
    const handleStudioEditing = () => {
        setIsEditingName(true);
    };

    const handleStudioName = () => {
        //DB에 변경 요청
        if (isEditingName) {
            putStudiotitleAPI();
            setIsEditingName(false);
        } else {
            setIsEditingName(true);
        }
    };

    const updateStudioName = (event: BaseSyntheticEvent) => {
        //스튜디오 주인만 수정 가능하도록
        if (userInfo.userId !== studioDetailInfo.studioOwner) {
            alert('스튜디오 이름 변경은 스튜디오 주인장만 가능합니다.');
            return;
        } else {
            setIsEditingName(true);
            if (studioDetailInfo !== null) {
                const newValue = { ...studioDetailInfo };
                newValue.studioTitle = event.target.value;
                setStudioDetailInfo(newValue);
            }
        }
    };

    /** 스튜디오 제목 수정 API */
    const putStudiotitleAPI = async () => {
        const id = studioDetailInfo.studioId;
        const title = studioDetailInfo.studioTitle;
        await modifyStudioTitle(id, title).then((res) => {
            if (res.status === httpStatusCode.OK) {
                console.log('제목이 수정되었습니닷!!!!');
            }
        });
    };

    /** onClickRecordPage
     * useNavigate를 이용하여 영상 녹화 화면으로 이동
     */
    const onClickRecordPage = () => {
        navigator(`/cliprecord/${studioDetailInfo.studioId}`);
    };

    //선택된 영상이 있는지 여부를 반환
    const isSelectedClipList = () => {
        let selectedClipListLength = 0;
        if (studioDetailInfo.clipInfoList) {
            studioDetailInfo.clipInfoList.map((clip) => {
                if (clip.clipOrder != -1) {
                    selectedClipListLength += 1;
                }
            });
        }
        return selectedClipListLength > 0;
    };

    const onClickCompletePage = async () => {
        if (!isSelectedClipList()) {
            alert('하나 이상의 영상을 선택해야 영상 편지 완성이 가능합니다');
            return;
        }
        console.log('complete letter');
        await encodingLetter(studioDetailInfo.studioId).then((res) => {
            console.log(res);
            moveStudioList();
        });
    };

    /** 리스트로 이동 */
    const moveStudioList = () => {
        navigator(`/studiolist`);
    };

    //////////////////////////////////전체편지 자동재생////////////////////////////////////////////////////////
    const playAllSelectedVideoRef = useRef<boolean>(false);
    const playingIdxRef = useRef<number>(0);

    /** stopButtonPressed()
     * 비디오 플레이어 일시 정지 버튼이 눌렸을 때 수행할 함수
     */
    const stopButtonPressed = () => {
        //자동 재생 중이었다면 초기화
        playAllSelectedVideoRef.current = false;
        playingIdxRef.current = 0;
        //영상 정지
        stopVideo();
    };

    /** startPlayList()
     *  비디오 연속 재생을 한다. 영상의 시작부터 차근차근
     */
    const startPlayList = () => {
        playAllSelectedVideoRef.current = true;
        //시간 초기화
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
        }
        if (usedVideoList.length > 0) {
            selectVideo(usedVideoList[0].clipId);
        }
    };

    //////////////////////////////////////////랜더링////////////////////////////////////////////////////////////

    return (
        <section className="relative section-top pt-14 ">
            {isDeleting ? (
                <DeleteCheckWindow
                    onClickOK={chooseDelete}
                    onClickCancel={chooseNotDelete}
                />
            ) : (
                <></>
            )}

            {/* 중앙 섹션 */}
            <div className="flex w-full h-full">
                {/* 좌측부분 */}
                <div className="w-1/4 h-full flex border border-r-2">
                    {/* 카테고리 */}
                    <div className="relative w-16 color-text-darkgray color-bg-lightgray1">
                        <div
                            className={`w-full h-16  flex flex-col justify-center items-center cursor-pointer`}
                            style={{
                                backgroundColor: 'white',
                                color: '#ff777f',
                            }}
                        >
                            <div className="h-16 categori-selected"></div>
                            <span className="material-symbols-outlined text-3xl">
                                movie_edit
                            </span>
                            <p className="font-bold">영상</p>
                        </div>
                    </div>
                    {/* 좌측사이드바 */}
                    <div className="w-4/5 h-full flex flex-col items-center px-4 py-4 overflow-y-scroll ">
                        <div className="w-full flex justify-start text-xl ">
                            <p>선택된 영상</p>
                        </div>

                        {usedVideoList ? (
                            usedVideoList.map((clip) => {
                                return (
                                    <VideoCard
                                        key={clip.clipId}
                                        onDelete={() => {
                                            onDelete(clip.clipId);
                                        }}
                                        onClick={() => {
                                            onClickEdit(clip.clipId);
                                        }}
                                        selectVideo={() => {
                                            selectVideo(clip.clipId);
                                        }}
                                        props={clip}
                                        presentUser={userInfo.userId}
                                        selectedClip={selectedVideo}
                                    />
                                );
                            })
                        ) : (
                            <></>
                        )}
                        <div className="w-full flex justify-start text-xl ">
                            <p>선택되지 않은 영상</p>
                        </div>
                        {unUsedVideoList ? (
                            unUsedVideoList.map((clip) => {
                                return (
                                    <VideoCard
                                        key={clip.clipId}
                                        onDelete={() => {
                                            onDelete(clip.clipId);
                                        }}
                                        onClick={() => {
                                            onClickEdit(clip.clipId);
                                        }}
                                        selectVideo={() => {
                                            selectVideo(clip.clipId);
                                        }}
                                        props={clip}
                                        presentUser={userInfo.userId}
                                        selectedClip={selectedVideo}
                                    />
                                );
                            })
                        ) : (
                            <></>
                        )}
                    </div>
                </div>
                {/* 우측부분 */}
                <div className="w-3/4 h-full flex justify-between">
                    <div className="w-3/4">
                        <div className="h-16 w-full px-6  color-bg-sublight text-black flex justify-between items-center">
                            <div className="w-full flex justify-between items-center">
                                <div className="flex w-fit">
                                    {/* <span
                                        className="flex items-center text-2xl material-symbols-outlined cursor-pointer"
                                        onClick={moveStudioList}
                                    >
                                        arrow_back_ios
                                    </span> */}
                                    <input
                                        type="text"
                                        value={studioDetailInfo?.studioTitle}
                                        className="w-3/4 border-b-2 color-bg-sublight flex items-center text-2xl text-white ms-2"
                                        maxLength={20}
                                        onChange={updateStudioName}
                                        onKeyDown={(event) => {
                                            //스튜디오 주인만 이름 변경 가능, 엔터키 눌리면 변경 가능
                                            if (
                                                event.key === 'Enter' &&
                                                isEditingName &&
                                                studioDetailInfo.studioOwner ===
                                                    userInfo.userId
                                            ) {
                                                handleStudioName();
                                            }
                                        }}
                                    />
                                    {isEditingName ? (
                                        <span
                                            className="material-symbols-outlined mx-2 text-2xl text-white cursor-pointer"
                                            onClick={handleStudioName}
                                        >
                                            check_circle
                                        </span>
                                    ) : (
                                        <span
                                            className="material-symbols-outlined mx-2 text-2xl text-white cursor-pointer"
                                            onClick={handleStudioName}
                                        >
                                            edit
                                        </span>
                                    )}
                                </div>

                                <div
                                    className="relative right-24 px-6 my-2 flex items-center justify-center bg-white border-2 rounded-md color-text-main color-border-main cursor-pointer hover:color-bg-sublight hover:text-white hover:border-white"
                                    onClick={startPlayList}
                                >
                                    <span className="material-symbols-outlined text-4xl">
                                        arrow_right
                                    </span>
                                    <p className="text-xl font-bold">
                                        전체 편지 자동 재생
                                    </p>
                                </div>
                                <div></div>
                            </div>
                        </div>
                        <div className=" flex flex-col justify-center items-center">
                            <div className="w-full  flex justify-start items-center">
                                <p className="mt-8 ms-12 mb-4 text-2xl min-h-[32px]">
                                    {selectedVideo.clipTitle}
                                </p>
                            </div>
                            <div className="relative">
                                <video
                                    src={selectedVideo.clipUrl}
                                    crossOrigin="anonymous"
                                    style={{
                                        transform: `rotateY(180deg)`,
                                        width: '800px',
                                        aspectRatio: 16 / 9,
                                        display: 'block',
                                        backgroundColor: 'black',
                                    }}
                                    autoPlay
                                    ref={videoRef}
                                    onLoadedData={() => {
                                        if (videoRef.current) {
                                            setWholeDuration(
                                                videoRef.current.duration
                                            );
                                        }
                                    }}
                                    onTimeUpdate={() => {
                                        if (videoRef.current) {
                                            setVideoNowPosition(
                                                videoRef.current.currentTime
                                            );
                                        }
                                    }}
                                    onEnded={() => {
                                        stopVideo();
                                    }}
                                />
                                {/* 프레임 */}
                                <img
                                    src={selectImgUrl}
                                    className="absolute top-0 lef-0"
                                    style={{
                                        width: '800px',
                                        aspectRatio: 16 / 9,
                                    }}
                                    alt=""
                                />
                                {/* 스티커 */}
                                {studioDetailInfo.studioStickerUrl.match(
                                    regex
                                ) ? (
                                    <img
                                        src={studioDetailInfo.studioStickerUrl}
                                        className="absolute top-0 lef-0"
                                        crossOrigin="anonymous"
                                        style={{
                                            width: '800px',
                                            aspectRatio: 16 / 9,
                                        }}
                                        alt=""
                                    />
                                ) : (
                                    <></>
                                )}
                            </div>
                            <div className="w-full flex justify-center items-center mt-4 px-12">
                                {/* 비디오 컨트롤러 */}
                                {!playingVideo ? (
                                    <img
                                        className="me-3"
                                        src="/src/assets/icons/play_icon.png"
                                        alt="플레이"
                                        onClick={playVideo}
                                    />
                                ) : (
                                    <img
                                        className="me-[9px] h-[29px]"
                                        src="/src/assets/icons/pause_icon.png"
                                        alt="정지"
                                        onClick={stopButtonPressed}
                                    />
                                )}
                                <div className="w-full h-2 bg-black relative">
                                    <div
                                        className={`h-2 bg-[#FF777F] absolute top-0 left-0 z-10`}
                                        style={{
                                            width: `${
                                                (videoNowPosition /
                                                    wholeDuration) *
                                                100
                                            }%`,
                                            maxWidth: `100%`,
                                        }}
                                    ></div>
                                </div>
                            </div>
                            <div className="w-full pl-[86px]">
                                {formatTime(videoNowPosition)}/
                                {formatTime(wholeDuration)}
                            </div>
                        </div>
                    </div>

                    {/* (영상 리스트, 참가자 관리) */}
                    <div className="w-1/4 p-2 border border-l-2 overflow-y-scroll">
                        <div className="w-full px-2 flex flex-col justify-center items-center">
                            <a
                                className="flex items-center gap-3 w-52 text-center my-2 p-1 rounded-lg text-xl color-bg-yellow2 shadow-darkShadow color-text-main cursor-pointer transform hover:scale-105"
                                onClick={onClickCompletePage}
                            >
                                <img
                                    className="w-9 h-9 ml-2.5"
                                    src="/src/assets/icons/letter_complete2.svg"
                                    alt=""
                                />
                                영상편지 완성하기
                            </a>
                            <div
                                className="w-full h-24 mx-4 my-2 color-bg-main text-white text-xl flex flex-col justify-center items-center border rounded-md cursor-pointer hover:color-bg-subbold"
                                onClick={onClickRecordPage}
                            >
                                <span className="material-symbols-outlined text-3xl">
                                    photo_camera
                                </span>
                                <p>새 영상 촬영하기</p>
                            </div>
                            <Link
                                to={`/lettermake/${studioDetailInfo.studioId}`}
                                className="w-full h-24 mx-4 my-2 color-border-main color-text-main text-xl flex flex-col justify-center items-center border rounded-md hover:color-bg-sublight hover:color-border-sublight hover:text-white"
                            >
                                <span className="material-symbols-outlined text-3xl">
                                    theaters
                                </span>
                                <p>영상편지 편집하기</p>
                            </Link>
                        </div>
                        {/* 할당된 영상 리스트 */}
                        <div className="px-4 mt-16">
                            <div className="w-full flex justify-start text-xl ">
                                <p>나의 영상</p>
                            </div>
                            {usedVideoList ? (
                                usedVideoList.map((clip) => {
                                    if (clip.clipOwner === userInfo.userId) {
                                        return (
                                            <VideoCard
                                                key={clip.clipId}
                                                onDelete={() => {
                                                    onDelete(clip.clipId);
                                                }}
                                                onClick={() => {
                                                    onClickEdit(clip.clipId);
                                                }}
                                                selectVideo={() => {
                                                    selectVideo(clip.clipId);
                                                }}
                                                props={clip}
                                                presentUser={userInfo.userId}
                                                selectedClip={selectedVideo}
                                            />
                                        );
                                    }
                                })
                            ) : (
                                <></>
                            )}
                            {unUsedVideoList ? (
                                unUsedVideoList.map((clip) => {
                                    if (clip.clipOwner === userInfo.userId) {
                                        return (
                                            <VideoCard
                                                key={clip.clipId}
                                                onDelete={() => {
                                                    onDelete(clip.clipId);
                                                }}
                                                onClick={() => {
                                                    onClickEdit(clip.clipId);
                                                }}
                                                selectVideo={() => {
                                                    selectVideo(clip.clipId);
                                                }}
                                                props={clip}
                                                presentUser={userInfo.userId}
                                                selectedClip={selectedVideo}
                                            />
                                        );
                                    }
                                })
                            ) : (
                                <></>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
