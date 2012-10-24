# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = "activerecord-postgresql-adapter"
  s.version = "0.0.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0") if s.respond_to? :required_rubygems_version=
  s.authors = ["Lars Kanis"]
  s.date = "2012-05-25"
  s.email = "lars@greiz-reinsdorf.de"
  s.homepage = "http://github.com/larskanis/activerecord-postgresql-adapter"
  s.require_paths = ["lib"]
  s.rubygems_version = "1.8.24"
  s.summary = "This gem forwards to activerecord's default postgresql adapter"

  if s.respond_to? :specification_version then
    s.specification_version = 3

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<pg>, [">= 0"])
    else
      s.add_dependency(%q<pg>, [">= 0"])
    end
  else
    s.add_dependency(%q<pg>, [">= 0"])
  end
end
