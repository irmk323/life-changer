package com.example.leetcodetrainer.shared;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** The test datasource starts from an empty schema and Flyway must reach the current additive version. */
@SpringBootTest
@ActiveProfiles("test")
class FlywayMigrationRegressionTest {
    @Autowired private DataSource dataSource;

    @Test
    void currentSchemaIncludesTheAdditiveRecursiveContractMigration() throws Exception {
        try (var connection = dataSource.getConnection(); var statement = connection.createStatement();
             var result = statement.executeQuery("select \"version\" from \"flyway_schema_history\" where \"success\" = true order by \"installed_rank\" desc limit 1")) {
            assertThat(result.next()).isTrue();
            assertThat(result.getString(1)).isEqualTo("30");
        }
    }

    @Test
    void upgradesAnExistingV29SchemaWithoutLosingAttemptRows() throws Exception {
        String url = "jdbc:h2:mem:flyway-v29-upgrade;DB_CLOSE_DELAY=-1;MODE=PostgreSQL";
        Flyway.configure().dataSource(url, "sa", "").target("29").load().migrate();
        try (var connection = java.sql.DriverManager.getConnection(url, "sa", ""); var statement = connection.createStatement()) {
            statement.executeUpdate("insert into attempts (id, problem_id, attempt_type, status, started_at, current_stage_order, language, compile_error_count, wrong_answer_count, timed_out, implementation_completed, understood_but_could_not_implement, edge_case_failure, created_at, updated_at) values ('90000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','INITIAL','IN_PROGRESS',CURRENT_TIMESTAMP,1,'Java',0,0,false,false,false,false,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)");
        }
        Flyway.configure().dataSource(url, "sa", "").load().migrate();
        try (var connection = java.sql.DriverManager.getConnection(url, "sa", ""); var statement = connection.createStatement();
             var rows = statement.executeQuery("select count(*) from attempts"); var table = connection.getMetaData().getTables(null, null, "ATTEMPT_RECURSIVE_CONTRACT", null)) {
            assertThat(rows.next()).isTrue(); assertThat(rows.getInt(1)).isEqualTo(1); assertThat(table.next()).isTrue();
        }
    }
}
