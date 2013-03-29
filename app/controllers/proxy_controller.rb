class ProxyController < ApplicationController

  skip_before_filter :authenticate_user!
  skip_authorization_check :only => [:default]
  skip_authorize_resource :only => [:default]
  skip_load_resource :only => [:default]

  def default
    http_proxy = BawSite::Application.config.custom_proxy

    conn = Faraday.new(:url => params[:url]) do |faraday|
      faraday.request  :url_encoded             # form-encode POST params
      faraday.response :logger                  # log requests to STDOUT
      faraday.adapter  Faraday.default_adapter  # make requests with Net::HTTP
      faraday.proxy http_proxy
    end

    response = conn.get

    result = ""
    result += response.status.to_s
    result += "\n <pre>"
    result += (response.headers).to_yaml
    result += "\n </pre>"
    result += "\n <hr/>"
    result += response.body

    render text: result
  end

end