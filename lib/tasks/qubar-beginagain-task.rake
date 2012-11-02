namespace :db do
  
  desc "Raise an error unless the RAILS_ENV is development"
  task :development_environment_only do
    raise "Hey, development only you monkey!" unless Rails.env == 'development'
  end
  
  desc "Drop, create, migrate then seed the development database"
  task :qubarbeginagain => %w(environment db:development_environment_only db:drop db:create db:migrate db:seed)
  end