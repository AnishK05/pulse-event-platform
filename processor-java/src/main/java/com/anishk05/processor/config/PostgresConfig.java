package com.anishk05.processor.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableJpaRepositories(basePackages = "com.anishk05.processor.db")
@EnableTransactionManagement
public class PostgresConfig {
    // Additional PostgreSQL configuration can be added here if needed
}


