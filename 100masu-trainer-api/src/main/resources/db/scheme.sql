create schema if not exists masu_db;

create table if not exists masu_db.score (
    id int primary key auto_increment,
    score_time float,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp
);
