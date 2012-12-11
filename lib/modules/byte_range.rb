# from
# http://code.google.com/p/http-byte-range/source/browse/trunk/plugins/byte_range/lib/byte_range.rb
# MIT license: http://code.google.com/p/http-byte-range/source/browse/trunk/plugins/byte_range/MIT-LICENSE
module ByteRange
  def self.included(base)
    base.send :include, InstanceMethods
    base.class_eval do
      after_filter :byte_range
    end
  end

  module InstanceMethods
    protected
    def byte_range
      ranges = request.env['HTTP_RANGE']
      if ranges
        response.headers['Accept-Ranges'] = 'bytes'
        response.headers['Status'] = '206'
        content_range = 'bytes '
        range = split_ranges(ranges).first
        content_range << range.to_s
        content_range << "/#{response.headers['Content-Length']}"
        if response.body.respond_to?(:length)
          response.body = response.body[range.first, range.read_length]
        else
          response.body = get_data_from_stream(range, response.body)
        end
        response.headers['Content-Range']  = content_range
        response.headers['Content-Length'] = range.read_length
      else
        response.headers['Accept-Ranges'] = 'bytes'
      end
    end

    def split_ranges(ranges)
      ranges.split(/,/).map {|range| HttpByteRangeSpecifier.new(range)}
    end

    def get_data_from_stream(range, rails_stream)
      count = 0
      out = StringIO.new
      rails_stream.call(nil, out) while out.length < range.last
      out.seek(range.first, IO::SEEK_SET)
      out.read(range.read_length)
    end
  end

  class HttpByteRangeSpecifier
    attr_reader :first, :last

    def initialize(range)
      @first, @last = parse(range)
    end

    def read_length
      @last - @first + 1
    end

    def to_s
      if @first && @last
        "#@first-#@last"
      end
    end

    protected
    def parse(range)
      case range
        when /(\d+)-(\d+)/
          return $1.to_i, $2.to_i
      end
    end
  end
end