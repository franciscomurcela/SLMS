package pt.ua.slms.service;

import org.springframework.stereotype.Service;
import pt.ua.slms.api.model.User;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private List<User> userList;

    public UserService() {
        userList = new ArrayList<>();

        User user1 = new User(1, "Xavi", "xavi@gmail.com");
        User user2 = new User(2, "Lima", "lima@gmail.com");
        User user3 = new User(3, "Chico", "chico@gmail.com");

        userList.addAll(Arrays.asList(user1, user2, user3));
    }

    public Optional<User> getUser(Integer id) {
        Optional optional = Optional.empty();
        for (User user : userList) {
            if (user.getId().equals(id)) {
                optional = Optional.of(user);
                return optional;
            }
        }
        return optional;
    }
}
