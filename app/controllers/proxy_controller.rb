class ProxyController < ApplicationController

  skip_before_filter :authenticate_user!
  skip_authorization_check :only => [:default]
  skip_authorize_resource :only => [:default]
  skip_load_resource :only => [:default]


  def default
    http_proxy = BawSite::Application.config.custom_proxy

    if params[:proxy]
      http_proxy = params[:proxy]
    end

    puts "HTTP PROXY for site is #{http_proxy}!!!!!!!!!!!!!!!"

    conn = Faraday.new(:url => params[:url]) do |faraday|
      faraday.request  :url_encoded             # form-encode POST params
      faraday.response :logger                  # log requests to STDOUT

      faraday.proxy http_proxy
      faraday.adapter  Faraday.default_adapter  # make requests with Net::HTTP

    end

    response = conn.get

    result = http_proxy + "\n"
    result += (response.status || '{empty status}').to_s
    result += "\n <pre>"
    result += (response.headers).to_yaml || '{empty headers}'
    result += "\n </pre>"
    result += "\n <hr/>"
    result += response.body || '{empty body}'

    render text: result
  end
end