import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();
const GithubProvider = ({ children }) => {
    const [githubUser, setGithubUser] = useState(mockUser);
    const [repos, setRepos] = useState(mockRepos);
    const [followers, setFollowers] = useState(mockFollowers);
    const [requests, setRequests] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState({ show: false, msg: "" });

    const searchGithubUser = async (user) => {
        toggleError();
        setIsLoading(true);
        const response = await axios(`${rootUrl}/users/${user}`).catch(
            (error) => console.log("error:", error)
        );
        console.log("response:", response);
        if (response) {
            setGithubUser(response.data);
            const { login, followers_url } = response.data;
            //Repos
            // - [Repos](https://api.github.com/users/john-smilga/repos?per_page=100)
            //followers
            // - [Followers](https://api.github.com/users/john-smilga/followers)
            const reposPromise = axios(
                `${rootUrl}/users/${login}/repos?per_page=100`
            );
            const followersPromise = axios(`${followers_url}?per_page=100`);
            await Promise.allSettled([reposPromise, followersPromise])
                .then((response) => {
                    const [repos, followers] = response;
                    if (repos.status === "fulfilled") {
                        setRepos(repos.value.data);
                    }
                    if (followers.status === "fulfilled") {
                        setFollowers(followers.value.data);
                    }
                })
                .catch((error) => console.log(error));
        } else {
            toggleError(true, "there is no user with that username");
        }
        checkRequests();
        setIsLoading(false);
    };

    const toggleError = (show = false, msg = "") => {
        setError({ show, msg });
    };

    const checkRequests = () => {
        axios(`${rootUrl}/rate_limit`)
            .then(({ data }) => {
                const {
                    rate: { remaining },
                } = data;
                setRequests(remaining);
                if (remaining === 0) {
                    toggleError(true, "You exceeded your rate limit");
                }
            })
            .catch((error) => console.log("error:", error));
    };

    useEffect(checkRequests, []);

    return (
        <GithubContext.Provider
            value={{
                githubUser,
                repos,
                followers,
                requests,
                error,
                searchGithubUser,
                isLoading,
            }}>
            {children}
        </GithubContext.Provider>
    );
};

export { GithubContext, GithubProvider };
