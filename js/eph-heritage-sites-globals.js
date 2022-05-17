'use strict';

// Constants and fixed parameters
const BASE_TITLE = 'Peta Situs Warisan – Ensiklopedia Warisan Negara Indonesia';
const ORGS = {
  KR   : 'Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi melalui Direktorat Jenderal Kebudayaan',
  DENR   : 'Departemen Lingkungan dan Sumber Daya Alam',
  WHC    : 'Komite Warisan Dunia UNESCO',
  RAMSAR : 'Konvensi Ramsar',
  ASEAN  : 'Pusat Keanekaragaman Hayati ASEAN',
}
const DESIGNATION_TYPES = {
  Q33506 : { org: 'KR'  , name: 'Museum Indonesia' , order: 101 },
  Q2736554 : { org: 'KR'  , name: 'Candi Indonesia'            , order: 102 },
  Q393259 : { org: 'KR'  , name: 'Taman Nasional Indonesia'     , order: 103 },
  Q839954 : { org: 'KR'  , name: 'Situs Arkeologi Indonesia'            , order: 104 },
  Q9259     : { org: 'WHC'   , name: 'Situs Warisan Dunia'          , order: 401 },
  Q43113623 : { partOf: 'Q9259' },
  Q17278671 : { org: 'WHC'   , name: 'Situs Warisan Dunia Sementara', order: 402 },
  Q19683138 : { org: 'RAMSAR', name: 'Situs Ramsar'                  , order: 501 },
  Q4654172  : { org: 'ASEAN' , name: 'Taman Warisan ASEAN'          , order: 601 },
}
const SPARQL_QUERY_0 =
`SELECT DISTINCT ?siteQid ?siteLabel ?designationQid WHERE {
  # National heritage site designations
  {
    ?site wdt:P31 ?designation ; wdt:P17 wd:Q252 .
    FILTER ( ?designation IN (
      wd:Q33506,  # Museum
      wd:Q2736554, # Candi of Indonesia
      wd:Q393259, # National Park of Indonesia
      wd:Q839954 # Archaeological Site
    ))
  }
  UNION
  # International heritage site designations in the Philippines
  {
    ?site wdt:P1435 ?designation ; wdt:P17 wd:Q252 .
    FILTER ( ?designation IN (
      wd:Q9259,      # World Heritage Site
      wd:Q17278671,  # tentative World Heritage Site
      wd:Q43113623,  # part of World Heritage Site
      wd:Q19683138,  # Ramsar Site
      wd:Q4654172    # ASEAN Heritage Park
    ))
  }
  ?site rdfs:label ?siteLabel . FILTER(LANG(?siteLabel) = "id") .
  BIND (SUBSTR(STR(?site       ), 32) AS ?siteQid       ) .
  BIND (SUBSTR(STR(?designation), 32) AS ?designationQid) .
} ORDER BY ?siteLabel`;
const SPARQL_QUERY_1 =
`SELECT ?siteQid ?coord WHERE {
  <SPARQLVALUESCLAUSE>
  ?site p:P625 ?coordStatement .
  ?coordStatement ps:P625 ?coord .
  # Do not include coordinates for parts
  FILTER NOT EXISTS { ?coordStatement pq:P518 ?x }
  BIND (SUBSTR(STR(?site), 32) AS ?siteQid) .
}`;
//    ?site wdt:P527 ?sitePart .
const SPARQL_QUERY_2 =
`SELECT ?siteQid ?designationQid ?declared ?declaredPrecision
       ?declaration ?declarationTitle ?declarationScan ?declarationText WHERE {
  <SPARQLVALUESCLAUSE>
  ?site p:P1435 ?designationStatement .
  ?designationStatement ps:P1435 ?designation .
  FILTER ( ?designation IN (
    wd:Q33506,  # Museum
    wd:Q2736554, # Candi of Indonesia
    wd:Q393259, # National Park of Indonesia
    wd:Q839954, # Archaeological Site
    wd:Q9259,      # World Heritage Site
    wd:Q17278671,  # tentative World Heritage Site
    wd:Q43113623,  # part of World Heritage Site
    wd:Q19683138,  # Ramsar Site
    wd:Q4654172    # ASEAN Heritage Park
  ))
  FILTER NOT EXISTS { ?designationStatement pqv:P582 ?endTime }
  OPTIONAL {
    ?designationStatement pqv:P580 ?declaredValue .
    ?declaredValue wikibase:timeValue ?declared ;
                   wikibase:timePrecision ?declaredPrecision .
  }
  OPTIONAL {
    ?designationStatement pq:P457 ?declaration .
    ?declaration wdt:P1476 ?declarationTitle .
    OPTIONAL { ?declaration wdt:P996 ?declarationScan }
    OPTIONAL {
      ?declarationText schema:about ?declaration ;
                       schema:isPartOf <https://en.wikisource.org/> .
    }
  }
  BIND (SUBSTR(STR(?site       ), 32) AS ?siteQid       ) .
  BIND (SUBSTR(STR(?designation), 32) AS ?designationQid) .
}`;
const SPARQL_QUERY_3 =
`SELECT ?siteQid ?image ?wikipediaUrlTitle WHERE {
  <SPARQLVALUESCLAUSE>
  OPTIONAL { ?site wdt:P18 ?image }
  OPTIONAL {
    ?wikipediaUrl schema:about ?site ;
                  schema:isPartOf <https://en.wikipedia.org/> .
  }
  BIND (SUBSTR(STR(?site        ), 32) AS ?siteQid          ) .
  BIND (SUBSTR(STR(?wikipediaUrl), 31) AS ?wikipediaUrlTitle) .
}`;
const ABOUT_SPARQL_QUERY =
`SELECT ?site ?siteLabel ?designationLabel ?declared ?declaration ?declarationTitle
       ?coord ?image ?wikipedia WHERE {
  # National heritage site designations
  {
    ?site p:P1435 ?designationStatement ; wdt:P17 wd:Q252 .
    ?designationStatement ps:P1435 ?designation .
    FILTER ( ?designation IN (
      wd:Q33506,  # Museum
      wd:Q2736554, # Candi of Indonesia
      wd:Q393259, # National Park of Indonesia
      wd:Q839954 # Archaeological Site
    ))
  }
  UNION
  # International heritage site designations in the Philippines
  {
    ?site wdt:P17 wd:Q928 .
    ?site p:P1435 ?designationStatement .
    ?designationStatement ps:P1435 ?designation .
    FILTER ( ?designation IN (
      wd:Q9259,      # World Heritage Site
      wd:Q17278671,  # tentative World Heritage Site
      wd:Q43113623,  # part of World Heritage Site
      wd:Q19683138,  # Ramsar Site
      wd:Q4654172    # ASEAN Heritage Park
    ))
  }
  FILTER NOT EXISTS { ?designationStatement pqv:P582 ?endTime }
  OPTIONAL { ?designationStatement pq:P580 ?declared }
  OPTIONAL {
    ?designationStatement pq:P457 ?declaration .
    ?declaration wdt:P1476 ?declarationTitle .
  }
  OPTIONAL {
    ?site p:P625 ?coordStatement .
    ?coordStatement ps:P625 ?coord .
    # Do not include coordinates for parts
    FILTER NOT EXISTS { ?coordStatement pq:P518 ?x }
  }
  OPTIONAL { ?site wdt:P18 ?image }
  OPTIONAL {
    ?wikipedia schema:about ?site ;
               schema:isPartOf <https://en.wikipedia.org/> .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}`;

// Globals
var DesignationIndex;  // Index of designation types