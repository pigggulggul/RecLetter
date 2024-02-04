import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {httpStatusCode} from '../util/http-status';
import {useDispatch} from 'react-redux';
import {loginState} from '../util/counter-slice';
import axios from "axios";

 export default function SocialPage() {

    /** 리덕스 설정 */
    const dispatch = useDispatch();
    const navigate = useNavigate();


    useEffect(() => {
        const currentUri = window.location.href;
        console.log("변경 전 호스트", currentUri)
        // 변경할 새로운 호스트
        const newHost = 'http://localhost:5173/api';
        // Axios 요청을 보내기 전에 URI의 호스트를 변경
        const modifiedUri = currentUri.replace(/^(http?:\/\/)([^\/]+)/, `${newHost}`);

        console.log("최종 경로",modifiedUri)
        fetchData(modifiedUri);

    }, []);

    const fetchData = async (modifiedUri:string) => {
        await axios.get(modifiedUri)
            .then((res) => {
                console.log("결과",res);
                if (res.status === httpStatusCode.OK) {
                    console.log('로그인이 성공했습니다.');
                    localStorage.setItem('access-token', res.data.accessToken);
                    localStorage.setItem('refresh-token', res.data.refreshToken);
                    localStorage.setItem('is-login', 'true');
                    dispatch(loginState(true));
                    navigate(`/studiolist`);
                } else if (res.status === httpStatusCode.BADREQUEST) {
                    console.log('bad request');
                }
            })
            .catch((error) => {
                console.log('오류', error);
            });
    };

    return (
        <div>
            흠
        </div>
    );
 }